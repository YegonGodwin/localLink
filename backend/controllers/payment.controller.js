import mongoose from "mongoose";
import Booking from "../models/Booking.model.js";
import Service from "../models/Service.model.js";
import Transaction from "../models/Transaction.model.js";
import Escrow from "../models/Escrow.model.js";
import LedgerEntry from "../models/LedgerEntry.model.js";
import Payout from "../models/Payout.model.js";
import Dispute from "../models/Dispute.model.js";
import Settings from "../models/Settings.model.js";
import { processEscrowAutoReleaseApprovals } from "../services/escrow.service.js";
import User from "../models/User.model.js";
import {
    roundToCurrency,
    computeCommission,
    canRetryPayout,
} from "../utils/paymentEscrow.helpers.js";

const MPESA_BASE_URL =
    process.env.MPESA_ENV === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

const normalizePhoneNumber = (input) => {
    if (!input) return null;
    const digits = input.toString().replace(/[^\d]/g, "");
    if (digits.startsWith("254") && digits.length === 12) return digits;
    if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
    if (digits.startsWith("7") && digits.length === 9) return `254${digits}`;
    return null;
};

const getTimestamp = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    return (
        now.getFullYear().toString() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) +
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds())
    );
};

const getAccessToken = async () => {
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    if (!key || !secret) {
        throw new Error("M-Pesa consumer key/secret not configured");
    }

    const auth = Buffer.from(`${key}:${secret}`).toString("base64");
    const res = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        method: "GET",
        headers: { Authorization: `Basic ${auth}` },
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) {
        throw new Error(data.errorMessage || "Failed to obtain M-Pesa access token");
    }
    return data.access_token;
};

const extractCallbackMetadata = (callback) => {
    const items = callback?.CallbackMetadata?.Item || [];
    return items.reduce((acc, item) => {
        if (item.Name) acc[item.Name] = item.Value;
        return acc;
    }, {});
};

const getEscrowConfig = async () => {
    const settings = await Settings.findOne().lean();

    const type = settings?.commissionType || "PERCENTAGE";
    const configuredValue = Number(
        settings?.commissionValue ?? settings?.platformFee ?? process.env.DEFAULT_PLATFORM_FEE_PERCENT ?? 5
    );
    const commissionValue = Number.isFinite(configuredValue) && configuredValue >= 0 ? configuredValue : 0;

    const configuredHours = Number(settings?.escrowAutoReleaseHours ?? process.env.ESCROW_AUTO_RELEASE_HOURS ?? 48);
    const holdHours = Number.isFinite(configuredHours) && configuredHours > 0 ? configuredHours : 48;

    return { commissionType: type, commissionValue, holdHours };
};

const getB2CConfig = () => {
    const shortcode = process.env.MPESA_B2C_SHORTCODE || process.env.MPESA_SHORTCODE;
    const initiatorName = process.env.MPESA_B2C_INITIATOR_NAME;
    const securityCredential = process.env.MPESA_B2C_SECURITY_CREDENTIAL;
    const resultUrl = process.env.MPESA_B2C_RESULT_URL;
    const timeoutUrl = process.env.MPESA_B2C_TIMEOUT_URL;
    const commandId = process.env.MPESA_B2C_COMMAND_ID || "BusinessPayment";

    const isDevFallback =
        process.env.MPESA_ENV !== "production" &&
        (!shortcode || !initiatorName || !securityCredential || !resultUrl || !timeoutUrl);

    return {
        shortcode,
        initiatorName,
        securityCredential,
        resultUrl,
        timeoutUrl,
        commandId,
        isDevFallback,
    };
};

const getPayoutRetryConfig = () => {
    const maxRetries = Number(process.env.ESCROW_PAYOUT_MAX_RETRIES ?? 3);
    const cooldownMinutes = Number(process.env.ESCROW_PAYOUT_RETRY_COOLDOWN_MINUTES ?? 5);
    return {
        maxRetries: Number.isFinite(maxRetries) && maxRetries >= 0 ? maxRetries : 3,
        cooldownMinutes: Number.isFinite(cooldownMinutes) && cooldownMinutes >= 0 ? cooldownMinutes : 5,
    };
};

const extractB2CResult = (payload) => payload?.Result || payload?.result || payload || {};

const extractResultParameters = (result) => {
    const params = result?.ResultParameters?.ResultParameter || [];
    return params.reduce((acc, item) => {
        if (item?.Key) acc[item.Key] = item.Value;
        return acc;
    }, {});
};

const isEscrowParticipant = (escrow, user) => {
    if (!escrow || !user) return false;
    if (user.role === "ADMIN") return true;
    const userId = user._id.toString();
    return escrow.consumer.toString() === userId || escrow.provider.toString() === userId;
};

const createLedgerEntryOnce = async ({ idempotencyKey, ...entry }) => {
    if (!idempotencyKey) {
        return LedgerEntry.create(entry);
    }

    const existing = await LedgerEntry.findOne({
        escrow: entry.escrow,
        entryType: entry.entryType,
        "metadata.idempotencyKey": idempotencyKey,
    }).select("_id");

    if (existing) return existing;

    return LedgerEntry.create({
        ...entry,
        metadata: {
            ...(entry.metadata || {}),
            idempotencyKey,
        },
    });
};

const setEscrowReleasedState = async ({ escrow, payout, callbackPayload }) => {
    const now = new Date();

    await Escrow.updateOne(
        { _id: escrow._id, state: { $in: ["RELEASING", "RELEASE_APPROVED"] } },
        {
            $set: {
                state: "RELEASED",
                releasedAt: now,
                metadata: {
                    ...(escrow.metadata || {}),
                    releasedAt: now,
                    releasedByPayout: payout._id,
                },
            },
        }
    );

    if (escrow.providerEscrowTransaction) {
        await Transaction.updateOne(
            { _id: escrow.providerEscrowTransaction },
            {
                $set: {
                    status: "COMPLETED",
                    transactionType: "PROVIDER_PAYOUT",
                    description: `Payout released for Booking #${escrow.booking.toString().slice(-6).toUpperCase()}`,
                },
            }
        );
    }

    const existingCommissionLedger = await LedgerEntry.findOne({
        escrow: escrow._id,
        entryType: "COMMISSION_RECOGNIZED",
    }).select("_id");

    if (!existingCommissionLedger && escrow.commissionAmount > 0) {
        await LedgerEntry.create({
            escrow: escrow._id,
            booking: escrow.booking,
            transaction: null,
            entryType: "COMMISSION_RECOGNIZED",
            direction: "CREDIT",
            amount: escrow.commissionAmount,
            description: `Commission recognized for booking ${escrow.booking}`,
            metadata: {
                commissionType: escrow.commissionType,
                commissionValue: escrow.commissionValue,
            },
        });
    }

    await createLedgerEntryOnce({
        idempotencyKey: `payout-completed:${payout._id}`,
        escrow: escrow._id,
        booking: escrow.booking,
        transaction: escrow.providerEscrowTransaction || null,
        entryType: "PROVIDER_PAYOUT_COMPLETED",
        direction: "DEBIT",
        amount: escrow.netAmount,
        description: `Provider payout completed for booking ${escrow.booking}`,
        metadata: callbackPayload || null,
    });
};

const setEscrowPayoutFailedState = async ({ escrow, payout, callbackPayload, reason }) => {
    await Escrow.updateOne(
        { _id: escrow._id, state: { $in: ["RELEASING", "RELEASE_APPROVED"] } },
        {
            $set: {
                state: "PAYOUT_FAILED",
                metadata: {
                    ...(escrow.metadata || {}),
                    lastPayoutFailedAt: new Date(),
                    lastPayoutFailedReason: reason || "B2C_FAILED",
                    lastFailedPayout: payout?._id || null,
                },
            },
        }
    );

    await createLedgerEntryOnce({
        idempotencyKey: `payout-failed:${payout?._id || "unknown"}`,
        escrow: escrow._id,
        booking: escrow.booking,
        transaction: escrow.providerEscrowTransaction || null,
        entryType: "ADJUSTMENT",
        direction: "CREDIT",
        amount: 0,
        description: `Provider payout failed for booking ${escrow.booking}`,
        metadata: callbackPayload || null,
    });
};

const initiateB2CPayoutForEscrow = async (escrow) => {
    if (!escrow) throw new Error("Escrow is required");

    const allowedStates = ["RELEASE_APPROVED", "PAYOUT_FAILED"];
    if (!allowedStates.includes(escrow.state)) {
        throw new Error(`Escrow is not releasable from state ${escrow.state}`);
    }

    const { maxRetries, cooldownMinutes } = getPayoutRetryConfig();
    const failedPayoutsCount = await Payout.countDocuments({ escrow: escrow._id, status: "FAILED" });
    const lastFailedPayout = await Payout.findOne({ escrow: escrow._id, status: "FAILED" })
        .sort({ updatedAt: -1 })
        .select("updatedAt");

    const retryDecision = canRetryPayout({
        escrowState: escrow.state,
        failedPayoutsCount,
        lastFailedPayoutAt: lastFailedPayout?.updatedAt || null,
        maxRetries,
        cooldownMinutes,
        now: new Date(),
    });

    if (!retryDecision.allowed && retryDecision.reason === "RETRY_LIMIT_REACHED") {
        throw new Error("Escrow payout retry limit reached");
    }

    if (!retryDecision.allowed && retryDecision.reason === "COOLDOWN_ACTIVE") {
        throw new Error(`Escrow payout retry cooldown active. Try again in ${retryDecision.waitSeconds}s`);
    }

    const existingInFlightPayout = await Payout.findOne({
        escrow: escrow._id,
        status: { $in: ["PENDING", "PROCESSING"] },
    });
    if (existingInFlightPayout) {
        return { payout: existingInFlightPayout, alreadyInFlight: true };
    }

    const provider = await User.findById(escrow.provider).select("phone");
    const normalizedPhone = normalizePhoneNumber(provider?.phone);
    if (!normalizedPhone) {
        throw new Error("Provider phone number is missing or invalid for B2C payout");
    }

    const amount = Math.round(escrow.netAmount);
    if (amount <= 0) {
        throw new Error("Escrow net amount is invalid for payout");
    }

    const payout = await Payout.create({
        escrow: escrow._id,
        provider: escrow.provider,
        amount,
        status: "PROCESSING",
        paymentProvider: "MPESA_B2C",
    });

    await Escrow.updateOne(
        { _id: escrow._id, state: { $in: allowedStates } },
        {
            $set: {
                state: "RELEASING",
                metadata: {
                    ...(escrow.metadata || {}),
                    payoutInitiatedAt: new Date(),
                    activePayoutId: payout._id,
                },
            },
        }
    );

    await createLedgerEntryOnce({
        idempotencyKey: `payout-initiated:${payout._id}`,
        escrow: escrow._id,
        booking: escrow.booking,
        transaction: escrow.providerEscrowTransaction || null,
        entryType: "PROVIDER_PAYOUT_INITIATED",
        direction: "DEBIT",
        amount,
        description: `Provider payout initiated for booking ${escrow.booking}`,
        metadata: { payoutId: payout._id },
    });

    try {
        const b2cConfig = getB2CConfig();
        if (b2cConfig.isDevFallback) {
            await Payout.updateOne(
                { _id: payout._id },
                {
                    $set: {
                        status: "SUCCESS",
                        resultCode: 0,
                        resultDesc: "Dev fallback: B2C config incomplete",
                    },
                }
            );
            await setEscrowReleasedState({
                escrow,
                payout,
                callbackPayload: { devFallback: true },
            });
            return {
                payout: await Payout.findById(payout._id),
                devFallback: true,
                alreadyInFlight: false,
            };
        }

        const { shortcode, initiatorName, securityCredential, resultUrl, timeoutUrl, commandId } = b2cConfig;
        if (!shortcode || !initiatorName || !securityCredential || !resultUrl || !timeoutUrl) {
            throw new Error("M-Pesa B2C configuration is incomplete");
        }

        const token = await getAccessToken();
        const originatorConversationId = `LL-B2C-${escrow._id.toString().slice(-6)}-${Date.now().toString().slice(-6)}`;

        const payload = {
            OriginatorConversationID: originatorConversationId,
            InitiatorName: initiatorName,
            SecurityCredential: securityCredential,
            CommandID: commandId,
            Amount: amount,
            PartyA: shortcode,
            PartyB: normalizedPhone,
            Remarks: process.env.MPESA_B2C_REMARKS || `Payout for booking ${escrow.booking}`,
            QueueTimeOutURL: timeoutUrl,
            ResultURL: resultUrl,
            Occasion: process.env.MPESA_B2C_OCCASION || "Service completion payout",
        };

        const response = await fetch(`${MPESA_BASE_URL}/mpesa/b2c/v3/paymentrequest`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        const accepted = response.ok && (data?.ResponseCode === "0" || data?.responseCode === "0");

        if (!accepted) {
            await Payout.updateOne(
                { _id: payout._id },
                {
                    $set: {
                        status: "FAILED",
                        originatorConversationId,
                        resultCode: Number(data?.ResponseCode) || Number(data?.responseCode) || -1,
                        resultDesc: data?.ResponseDescription || data?.errorMessage || "Failed to initiate B2C payout",
                        rawCallback: data,
                    },
                }
            );

            await setEscrowPayoutFailedState({
                escrow,
                payout,
                callbackPayload: data,
                reason: "B2C_INITIATION_FAILED",
            });

            return {
                payout: await Payout.findById(payout._id),
                devFallback: false,
                alreadyInFlight: false,
            };
        }

        await Payout.updateOne(
            { _id: payout._id },
            {
                $set: {
                    status: "PROCESSING",
                    originatorConversationId,
                    conversationId: data?.ConversationID || data?.conversationID || null,
                    resultCode: 0,
                    resultDesc: data?.ResponseDescription || "Accepted for processing",
                    rawCallback: data,
                },
            }
        );

        return {
            payout: await Payout.findById(payout._id),
            devFallback: false,
            alreadyInFlight: false,
        };
    } catch (error) {
        await Payout.updateOne(
            { _id: payout._id },
            {
                $set: {
                    status: "FAILED",
                    resultCode: -1,
                    resultDesc: error?.message || "B2C payout initiation failed",
                },
            }
        );

        await setEscrowPayoutFailedState({
            escrow,
            payout,
            callbackPayload: null,
            reason: "B2C_EXCEPTION",
        });

        throw error;
    }
};

const createBookingsForTransaction = async (transaction) => {
    if (!transaction?.services?.length) return;
    const services = await Service.find({ _id: { $in: transaction.services } });
    if (!services.length) return;
    const { commissionType, commissionValue, holdHours } = await getEscrowConfig();

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const now = new Date();
            const holdUntil = new Date(now.getTime() + holdHours * 60 * 60 * 1000);

            const bookingDocs = services.map((service) => ({
                service: service._id,
                consumer: transaction.user,
                provider: service.provider,
                date: new Date(),
                price: service.price,
            }));

            const createdBookings = await Booking.insertMany(bookingDocs, { session });

            const escrowDocs = createdBookings.map((booking) => {
                const { grossAmount, commissionAmount, netAmount } = computeCommission({
                    grossAmount: booking.price,
                    commissionType,
                    commissionValue,
                });

                return {
                    booking: booking._id,
                    consumer: booking.consumer,
                    provider: booking.provider,
                    consumerPaymentTransaction: transaction._id,
                    grossAmount,
                    commissionAmount,
                    netAmount,
                    commissionType,
                    commissionValue,
                    holdUntil,
                    state: "HELD",
                };
            });

            const createdEscrows = await Escrow.insertMany(escrowDocs, { session });

            const providerEscrowTransactions = createdEscrows.map((escrow) => ({
                booking: escrow.booking,
                escrow: escrow._id,
                user: escrow.provider,
                amount: escrow.netAmount,
                status: "PENDING",
                transactionType: "ESCROW_HOLD",
                description: `Escrow hold for Booking #${escrow.booking.toString().slice(-6).toUpperCase()}`,
            }));

            if (providerEscrowTransactions.length > 0) {
                const createdProviderTransactions = await Transaction.insertMany(providerEscrowTransactions, {
                    session,
                });

                await Promise.all(
                    createdEscrows.map((escrow, index) =>
                        Escrow.updateOne(
                            { _id: escrow._id },
                            { $set: { providerEscrowTransaction: createdProviderTransactions[index]._id } },
                            { session }
                        )
                    )
                );

                const ledgerEntries = createdEscrows.flatMap((escrow) => [
                    {
                        escrow: escrow._id,
                        booking: escrow.booking,
                        transaction: transaction._id,
                        entryType: "CUSTOMER_PAYMENT_RECEIVED",
                        direction: "CREDIT",
                        amount: escrow.grossAmount,
                        description: `Customer payment received for booking ${escrow.booking}`,
                    },
                    {
                        escrow: escrow._id,
                        booking: escrow.booking,
                        transaction: createdProviderTransactions.find(
                            (tx) => tx.escrow.toString() === escrow._id.toString()
                        )?._id,
                        entryType: "ESCROW_HOLD_RECORDED",
                        direction: "DEBIT",
                        amount: escrow.netAmount,
                        description: `Escrow hold recorded for booking ${escrow.booking}`,
                    },
                ]);

                if (ledgerEntries.length > 0) {
                    await LedgerEntry.insertMany(ledgerEntries, { session });
                }
            }

            await Transaction.updateOne(
                { _id: transaction._id, bookingCreated: { $ne: true } },
                { $set: { bookingCreated: true, bookingCreationInProgress: false } },
                { session }
            );
        });
    } finally {
        session.endSession();
    }
};

// @desc    Initiate M-Pesa STK Push
// @route   POST /api/payments/mpesa/stk-push
// @access  Private
export const initiateMpesaStkPush = async (req, res) => {
    const { phoneNumber, serviceIds } = req.body;
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhone) {
        return res.status(400).json({ message: "Invalid phone number" });
    }

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
        return res.status(400).json({ message: "No services selected for payment" });
    }

    const services = await Service.find({ _id: { $in: serviceIds } });
    if (services.length !== serviceIds.length) {
        return res.status(404).json({ message: "One or more services not found" });
    }

    const providerIds = new Set(services.map((s) => s.provider.toString()));
    if (providerIds.size > 1) {
        return res.status(400).json({ message: "All services must belong to the same provider" });
    }

    const amount = services.reduce((sum, s) => sum + (s.price || 0), 0);
    if (amount <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
    }

    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;

    const isDevFallback = process.env.MPESA_ENV !== "production" && (!shortcode || !passkey || !callbackUrl);
    if (!shortcode || !passkey || !callbackUrl) {
        if (!isDevFallback) {
            return res.status(500).json({ message: "M-Pesa configuration is incomplete" });
        }
    }

    const timestamp = getTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const reference = `LL-${req.user._id.toString().slice(-6)}-${Date.now().toString().slice(-6)}`;

    const stkPayload = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: normalizedPhone,
        PartyB: shortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrl,
        AccountReference: reference,
        TransactionDesc: "LocalLink services payment",
    };

    try {
        if (isDevFallback) {
            const transaction = await Transaction.create({
                user: req.user._id,
                amount,
                status: "COMPLETED",
                transactionType: "CUSTOMER_PAYMENT",
                description: `M-Pesa payment (dev fallback) for ${services.length} service${services.length === 1 ? "" : "s"}`,
                paymentProvider: "MPESA",
                phoneNumber: normalizedPhone,
                checkoutRequestId: `DEV-${Date.now()}`,
                merchantRequestId: `DEV-${Date.now()}`,
                accountReference: reference,
                services: services.map((s) => s._id),
                provider: services[0].provider,
                resultCode: 0,
                resultDesc: "Dev fallback: no Daraja config",
            });

            try {
                await createBookingsForTransaction(transaction);
            } catch (error) {
                console.error("Failed to create bookings for dev fallback payment:", error);
            }

            return res.json({
                transactionId: transaction._id,
                checkoutRequestId: transaction.checkoutRequestId,
                merchantRequestId: transaction.merchantRequestId,
                amount: transaction.amount,
                devFallback: true,
            });
        }

        const token = await getAccessToken();
        const resMpesa = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(stkPayload),
        });

        const data = await resMpesa.json();

        if (!resMpesa.ok || data.ResponseCode !== "0") {
            return res.status(400).json({
                message: data.ResponseDescription || data.errorMessage || "Failed to initiate payment",
            });
        }

        const transaction = await Transaction.create({
            user: req.user._id,
            amount,
            status: "PENDING",
            transactionType: "CUSTOMER_PAYMENT",
            description: `M-Pesa payment for ${services.length} service${services.length === 1 ? "" : "s"}`,
            paymentProvider: "MPESA",
            phoneNumber: normalizedPhone,
            checkoutRequestId: data.CheckoutRequestID,
            merchantRequestId: data.MerchantRequestID,
            accountReference: reference,
            services: services.map((s) => s._id),
            provider: services[0].provider,
        });

        res.json({
            transactionId: transaction._id,
            checkoutRequestId: data.CheckoutRequestID,
            merchantRequestId: data.MerchantRequestID,
            amount: transaction.amount,
        });
    } catch (error) {
        console.error("Failed to initiate M-Pesa STK push:", error);
        res.status(500).json({ message: "Failed to initiate M-Pesa payment" });
    }
};

// @desc    M-Pesa callback handler
// @route   POST /api/payments/mpesa/callback
// @access  Public
export const handleMpesaCallback = async (req, res) => {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) {
        return res.status(400).json({ message: "Invalid callback payload" });
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    if (!checkoutRequestId) {
        return res.status(400).json({ message: "Missing CheckoutRequestID" });
    }

    const transaction = await Transaction.findOne({ checkoutRequestId });
    if (!transaction) {
        return res.status(200).json({ message: "Transaction not found" });
    }

    const metadata = extractCallbackMetadata(callback);
    const isSuccess = Number(callback.ResultCode) === 0;

    if (transaction.status !== "COMPLETED" && transaction.status !== "FAILED") {
        transaction.status = isSuccess ? "COMPLETED" : "FAILED";
        transaction.resultCode = callback.ResultCode;
        transaction.resultDesc = callback.ResultDesc;
        transaction.mpesaReceiptNumber = metadata.MpesaReceiptNumber || null;
        transaction.metadata = metadata;
        transaction.rawCallback = callback;
        await transaction.save();
    }

    if (isSuccess && !transaction.bookingCreated && transaction.status === "COMPLETED") {
        const claimed = await Transaction.findOneAndUpdate(
            {
                _id: transaction._id,
                bookingCreated: { $ne: true },
                bookingCreationInProgress: { $ne: true },
            },
            { $set: { bookingCreationInProgress: true } },
            { new: true }
        );

        if (claimed) {
            try {
                await createBookingsForTransaction(claimed);
            } catch (error) {
                await Transaction.updateOne(
                    { _id: claimed._id },
                    { $set: { bookingCreationInProgress: false } }
                );
                console.error("Failed to create bookings for transaction:", error);
            }
        }
    }

    res.status(200).json({ message: "Callback received" });
};

// @desc    Process escrow records eligible for auto release approval
// @route   POST /api/payments/escrow/process-auto-release
// @access  Private/Admin
export const processEscrowAutoRelease = async (req, res) => {
    const outcome = await processEscrowAutoReleaseApprovals();
    res.status(200).json({
        message: "Escrow auto-release approval processing completed",
        ...outcome,
    });
};

// @desc    Initiate B2C payout for a releasable escrow
// @route   POST /api/payments/escrow/:escrowId/release
// @access  Private/Admin
export const releaseEscrowToProvider = async (req, res) => {
    const { escrowId } = req.params;
    const escrow = await Escrow.findById(escrowId);
    if (!escrow) {
        return res.status(404).json({ message: "Escrow not found" });
    }

    const result = await initiateB2CPayoutForEscrow(escrow);
    return res.status(200).json({
        message: result.alreadyInFlight ? "Payout already in progress" : "Payout initiated",
        escrowId: escrow._id,
        payout: result.payout,
        devFallback: Boolean(result.devFallback),
        alreadyInFlight: Boolean(result.alreadyInFlight),
    });
};

// @desc    Process B2C payout queue for approved escrows
// @route   POST /api/payments/escrow/process-release-queue
// @access  Private/Admin
export const processEscrowReleaseQueueBatch = async ({ limit = 20 } = {}) => {
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const escrows = await Escrow.find({
        state: { $in: ["RELEASE_APPROVED", "PAYOUT_FAILED"] },
    })
        .sort({ updatedAt: 1 })
        .limit(safeLimit);

    let initiated = 0;
    let inFlight = 0;
    const failed = [];

    for (const escrow of escrows) {
        try {
            const result = await initiateB2CPayoutForEscrow(escrow);
            if (result.alreadyInFlight) {
                inFlight += 1;
            } else {
                initiated += 1;
            }
        } catch (error) {
            failed.push({
                escrowId: escrow._id,
                message: error?.message || "Failed to initiate payout",
            });
        }
    }

    return {
        scanned: escrows.length,
        initiated,
        inFlight,
        failed,
    };
};

// @desc    Process B2C payout queue for approved escrows
// @route   POST /api/payments/escrow/process-release-queue
// @access  Private/Admin
export const processEscrowReleaseQueue = async (req, res) => {
    const outcome = await processEscrowReleaseQueueBatch({ limit: req.body?.limit });
    return res.status(200).json({
        message: "Escrow release queue processed",
        ...outcome,
    });
};

// @desc    Handle M-Pesa B2C result callback
// @route   POST /api/payments/mpesa/b2c/result
// @access  Public
export const handleMpesaB2CResultCallback = async (req, res) => {
    const result = extractB2CResult(req.body);
    const originatorConversationId = result?.OriginatorConversationID || null;
    const conversationId = result?.ConversationID || null;

    if (!originatorConversationId && !conversationId) {
        return res.status(400).json({ message: "Missing B2C conversation identifiers" });
    }

    const payout = await Payout.findOne({
        $or: [
            ...(originatorConversationId ? [{ originatorConversationId }] : []),
            ...(conversationId ? [{ conversationId }] : []),
        ],
    });

    if (!payout) {
        return res.status(200).json({ message: "Payout not found" });
    }

    const escrow = await Escrow.findById(payout.escrow);
    if (!escrow) {
        await Payout.updateOne(
            { _id: payout._id },
            {
                $set: {
                    status: "FAILED",
                    resultCode: -1,
                    resultDesc: "Escrow not found during callback processing",
                    rawCallback: req.body,
                },
            }
        );
        return res.status(200).json({ message: "Escrow missing for payout" });
    }

    const resultCode = Number(result?.ResultCode);
    const isSuccess = resultCode === 0;
    const params = extractResultParameters(result);

    if (payout.status === "SUCCESS") {
        return res.status(200).json({ message: "B2C callback already processed" });
    }

    if (payout.status === "FAILED" && !isSuccess) {
        return res.status(200).json({ message: "B2C failure callback already processed" });
    }

    if (payout.status === "FAILED" && isSuccess && escrow.state === "RELEASED") {
        return res.status(200).json({ message: "Late success ignored; escrow already released" });
    }

    await Payout.updateOne(
        { _id: payout._id },
        {
            $set: {
                status: isSuccess ? "SUCCESS" : "FAILED",
                conversationId: conversationId || payout.conversationId,
                originatorConversationId: originatorConversationId || payout.originatorConversationId,
                resultCode: Number.isFinite(resultCode) ? resultCode : -1,
                resultDesc: result?.ResultDesc || result?.resultDesc || null,
                rawCallback: req.body,
            },
        }
    );

    if (isSuccess) {
        await setEscrowReleasedState({
            escrow,
            payout,
            callbackPayload: {
                ...req.body,
                resultParameters: params,
            },
        });
        return res.status(200).json({ message: "B2C success callback processed" });
    }

    await setEscrowPayoutFailedState({
        escrow,
        payout,
        callbackPayload: {
            ...req.body,
            resultParameters: params,
        },
        reason: "B2C_RESULT_FAILED",
    });

    return res.status(200).json({ message: "B2C failure callback processed" });
};

// @desc    Handle M-Pesa B2C timeout callback
// @route   POST /api/payments/mpesa/b2c/timeout
// @access  Public
export const handleMpesaB2CTimeoutCallback = async (req, res) => {
    const result = extractB2CResult(req.body);
    const originatorConversationId = result?.OriginatorConversationID || req.body?.OriginatorConversationID;

    if (!originatorConversationId) {
        return res.status(400).json({ message: "Missing OriginatorConversationID" });
    }

    const payout = await Payout.findOne({ originatorConversationId });
    if (!payout) {
        return res.status(200).json({ message: "Payout not found" });
    }

    if (["SUCCESS", "FAILED"].includes(payout.status)) {
        return res.status(200).json({ message: "Timeout callback already processed" });
    }

    const escrow = await Escrow.findById(payout.escrow);
    await Payout.updateOne(
        { _id: payout._id },
        {
            $set: {
                status: "FAILED",
                resultCode: -1,
                resultDesc: "B2C request timed out",
                rawCallback: req.body,
            },
        }
    );

    if (escrow) {
        await setEscrowPayoutFailedState({
            escrow,
            payout,
            callbackPayload: req.body,
            reason: "B2C_TIMEOUT",
        });
    }

    return res.status(200).json({ message: "B2C timeout callback processed" });
};

// @desc    Get escrow reconciliation details
// @route   GET /api/payments/escrow/:escrowId/reconciliation
// @access  Private/Admin
export const getEscrowReconciliation = async (req, res) => {
    const { escrowId } = req.params;
    const escrow = await Escrow.findById(escrowId)
        .populate("booking", "status service consumer provider price")
        .populate("consumer", "name email")
        .populate("provider", "name email")
        .lean();

    if (!escrow) {
        return res.status(404).json({ message: "Escrow not found" });
    }

    const [payouts, ledgerEntries] = await Promise.all([
        Payout.find({ escrow: escrow._id }).sort({ createdAt: -1 }).lean(),
        LedgerEntry.find({ escrow: escrow._id }).sort({ createdAt: 1 }).lean(),
    ]);

    const totals = ledgerEntries.reduce(
        (acc, entry) => {
            if (entry.direction === "CREDIT") acc.credits += entry.amount || 0;
            if (entry.direction === "DEBIT") acc.debits += entry.amount || 0;
            return acc;
        },
        { credits: 0, debits: 0 }
    );

    const balance = roundToCurrency((totals.credits || 0) - (totals.debits || 0));

    return res.status(200).json({
        escrow: {
            id: escrow._id,
            state: escrow.state,
            holdUntil: escrow.holdUntil,
            releasedAt: escrow.releasedAt,
            grossAmount: escrow.grossAmount,
            commissionAmount: escrow.commissionAmount,
            netAmount: escrow.netAmount,
            commissionType: escrow.commissionType,
            commissionValue: escrow.commissionValue,
            consumer: escrow.consumer,
            provider: escrow.provider,
            booking: escrow.booking,
        },
        payouts: payouts.map((payout) => ({
            id: payout._id,
            amount: payout.amount,
            status: payout.status,
            resultCode: payout.resultCode,
            resultDesc: payout.resultDesc,
            originatorConversationId: payout.originatorConversationId,
            conversationId: payout.conversationId,
            createdAt: payout.createdAt,
            updatedAt: payout.updatedAt,
        })),
        ledger: {
            entries: ledgerEntries.map((entry) => ({
                id: entry._id,
                entryType: entry.entryType,
                direction: entry.direction,
                amount: entry.amount,
                description: entry.description,
                createdAt: entry.createdAt,
                metadata: entry.metadata || null,
            })),
            totals: {
                credits: roundToCurrency(totals.credits),
                debits: roundToCurrency(totals.debits),
                balance,
            },
        },
    });
};

// @desc    List disputes (admin/global, or participant filtered)
// @route   GET /api/payments/disputes
// @access  Private
export const getDisputes = async (req, res) => {
    const { status, escrowId, bookingId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (escrowId) query.escrow = escrowId;
    if (bookingId) query.booking = bookingId;

    const disputes = await Dispute.find(query)
        .sort({ createdAt: -1 })
        .populate("raisedBy", "name email role")
        .populate("resolvedBy", "name email role")
        .populate("escrow", "state holdUntil grossAmount commissionAmount netAmount")
        .populate("booking", "status");

    if (req.user.role === "ADMIN") {
        return res.status(200).json(disputes);
    }

    const filtered = disputes.filter((dispute) => {
        const escrow = dispute.escrow;
        if (!escrow) return false;
        return isEscrowParticipant(escrow, req.user);
    });

    return res.status(200).json(filtered);
};

// @desc    Escrow operations summary for admin dashboard
// @route   GET /api/payments/escrow/ops-summary
// @access  Private/Admin
export const getEscrowOpsSummary = async (req, res) => {
    const [held, releaseApproved, releasing, released, disputed, payoutFailed, openDisputes] =
        await Promise.all([
            Escrow.countDocuments({ state: "HELD" }),
            Escrow.countDocuments({ state: "RELEASE_APPROVED" }),
            Escrow.countDocuments({ state: "RELEASING" }),
            Escrow.countDocuments({ state: "RELEASED" }),
            Escrow.countDocuments({ state: "DISPUTED" }),
            Escrow.countDocuments({ state: "PAYOUT_FAILED" }),
            Dispute.countDocuments({ status: "OPEN" }),
        ]);

    return res.status(200).json({
        held,
        releaseApproved,
        releasing,
        released,
        disputed,
        payoutFailed,
        openDisputes,
    });
};

// @desc    Raise escrow dispute
// @route   POST /api/payments/escrow/:escrowId/disputes
// @access  Private
export const raiseEscrowDispute = async (req, res) => {
    const { escrowId } = req.params;
    const { reason, evidence } = req.body;

    if (!reason || !reason.trim()) {
        return res.status(400).json({ message: "Dispute reason is required" });
    }

    const escrow = await Escrow.findById(escrowId);
    if (!escrow) {
        return res.status(404).json({ message: "Escrow not found" });
    }

    if (!isEscrowParticipant(escrow, req.user)) {
        return res.status(403).json({ message: "Not authorized to dispute this escrow" });
    }

    if (["RELEASED", "CANCELLED", "REFUNDED"].includes(escrow.state)) {
        return res.status(400).json({ message: `Cannot dispute escrow in state ${escrow.state}` });
    }

    const openDispute = await Dispute.findOne({ escrow: escrow._id, status: "OPEN" });
    if (openDispute) {
        return res.status(409).json({ message: "An open dispute already exists for this escrow" });
    }

    const dispute = await Dispute.create({
        escrow: escrow._id,
        booking: escrow.booking,
        raisedBy: req.user._id,
        raisedByRole: req.user.role,
        reason: reason.trim(),
        evidence: evidence || null,
        status: "OPEN",
    });

    await Escrow.updateOne(
        { _id: escrow._id },
        {
            $set: {
                state: "DISPUTED",
                metadata: {
                    ...(escrow.metadata || {}),
                    disputeOpen: true,
                    disputeId: dispute._id,
                    disputedAt: new Date(),
                },
            },
        }
    );

    await LedgerEntry.create({
        escrow: escrow._id,
        booking: escrow.booking,
        transaction: null,
        entryType: "ADJUSTMENT",
        direction: "CREDIT",
        amount: 0,
        description: `Dispute opened for booking ${escrow.booking}`,
        metadata: { disputeId: dispute._id, raisedBy: req.user._id, reason: reason.trim() },
    });

    return res.status(201).json(dispute);
};

// @desc    List escrow disputes
// @route   GET /api/payments/escrow/:escrowId/disputes
// @access  Private
export const listEscrowDisputes = async (req, res) => {
    const { escrowId } = req.params;
    const escrow = await Escrow.findById(escrowId);
    if (!escrow) {
        return res.status(404).json({ message: "Escrow not found" });
    }

    if (!isEscrowParticipant(escrow, req.user)) {
        return res.status(403).json({ message: "Not authorized to view disputes for this escrow" });
    }

    const disputes = await Dispute.find({ escrow: escrow._id })
        .sort({ createdAt: -1 })
        .populate("raisedBy", "name email role")
        .populate("resolvedBy", "name email role");

    return res.status(200).json(disputes);
};

// @desc    Resolve escrow dispute
// @route   POST /api/payments/disputes/:disputeId/resolve
// @access  Private/Admin
export const resolveEscrowDispute = async (req, res) => {
    const { disputeId } = req.params;
    const { action, note, holdExtensionHours } = req.body;

    if (!["RELEASE", "CANCEL", "KEEP_HOLD"].includes(action)) {
        return res.status(400).json({ message: "Invalid dispute resolution action" });
    }

    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
    }

    if (dispute.status !== "OPEN") {
        return res.status(400).json({ message: "Dispute is already resolved" });
    }

    const escrow = await Escrow.findById(dispute.escrow);
    if (!escrow) {
        return res.status(404).json({ message: "Escrow not found for dispute" });
    }

    const now = new Date();
    let nextEscrowState = escrow.state;
    let nextHoldUntil = escrow.holdUntil;

    if (action === "RELEASE") {
        if (["RELEASED", "CANCELLED", "REFUNDED"].includes(escrow.state)) {
            return res.status(400).json({ message: `Cannot release escrow in state ${escrow.state}` });
        }
        nextEscrowState = "RELEASE_APPROVED";
    } else if (action === "CANCEL") {
        if (["RELEASED", "CANCELLED", "REFUNDED"].includes(escrow.state)) {
            return res.status(400).json({ message: `Cannot cancel escrow in state ${escrow.state}` });
        }
        nextEscrowState = "CANCELLED";
    } else {
        const extension = Math.max(0, Number(holdExtensionHours) || 0);
        nextEscrowState = "HELD";
        if (extension > 0) {
            const baseline = new Date(Math.max(now.getTime(), new Date(escrow.holdUntil).getTime()));
            nextHoldUntil = new Date(baseline.getTime() + extension * 60 * 60 * 1000);
        }
    }

    await Escrow.updateOne(
        { _id: escrow._id },
        {
            $set: {
                state: nextEscrowState,
                holdUntil: nextHoldUntil,
                metadata: {
                    ...(escrow.metadata || {}),
                    disputeOpen: false,
                    disputeId: dispute._id,
                    disputeResolvedAt: now,
                    disputeResolutionAction: action,
                    disputeResolutionNote: note || null,
                    resolvedBy: req.user._id,
                },
            },
        }
    );

    if (action === "CANCEL") {
        if (escrow.providerEscrowTransaction) {
            await Transaction.updateOne(
                { _id: escrow.providerEscrowTransaction },
                {
                    $set: {
                        status: "FAILED",
                        description: `Escrow cancelled for Booking #${escrow.booking.toString().slice(-6).toUpperCase()}`,
                    },
                }
            );
        }

        await Transaction.updateOne(
            { _id: escrow.consumerPaymentTransaction },
            {
                $set: {
                    status: "REFUNDED",
                    transactionType: "REFUND",
                    description: `Refund issued for Booking #${escrow.booking.toString().slice(-6).toUpperCase()}`,
                },
            }
        );

        await LedgerEntry.create({
            escrow: escrow._id,
            booking: escrow.booking,
            transaction: escrow.consumerPaymentTransaction || null,
            entryType: "REFUND_ISSUED",
            direction: "DEBIT",
            amount: escrow.grossAmount,
            description: `Refund issued for booking ${escrow.booking}`,
            metadata: { disputeId: dispute._id },
        });
    }

    dispute.status = "RESOLVED";
    dispute.resolutionAction = action;
    dispute.resolutionNote = note || null;
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = now;
    await dispute.save();

    return res.status(200).json({
        message: "Dispute resolved",
        dispute,
        escrowId: escrow._id,
        escrowState: nextEscrowState,
        holdUntil: nextHoldUntil,
    });
};

// @desc    Extend escrow hold window
// @route   POST /api/payments/escrow/:escrowId/hold/extend
// @access  Private/Admin
export const extendEscrowHold = async (req, res) => {
    const { escrowId } = req.params;
    const { hours, reason } = req.body;

    const extensionHours = Number(hours);
    if (!Number.isFinite(extensionHours) || extensionHours <= 0) {
        return res.status(400).json({ message: "A positive hold extension in hours is required" });
    }

    const escrow = await Escrow.findById(escrowId);
    if (!escrow) {
        return res.status(404).json({ message: "Escrow not found" });
    }

    if (["RELEASED", "CANCELLED", "REFUNDED"].includes(escrow.state)) {
        return res.status(400).json({ message: `Cannot extend hold for escrow in state ${escrow.state}` });
    }

    const now = new Date();
    const baseline = new Date(Math.max(now.getTime(), new Date(escrow.holdUntil).getTime()));
    const holdUntil = new Date(baseline.getTime() + extensionHours * 60 * 60 * 1000);

    await Escrow.updateOne(
        { _id: escrow._id },
        {
            $set: {
                holdUntil,
                metadata: {
                    ...(escrow.metadata || {}),
                    holdExtendedAt: now,
                    holdExtendedBy: req.user._id,
                    holdExtensionHours: extensionHours,
                    holdExtensionReason: reason || null,
                },
            },
        }
    );

    await LedgerEntry.create({
        escrow: escrow._id,
        booking: escrow.booking,
        transaction: null,
        entryType: "ADJUSTMENT",
        direction: "CREDIT",
        amount: 0,
        description: `Escrow hold extended by ${extensionHours}h for booking ${escrow.booking}`,
        metadata: { reason: reason || null, extendedBy: req.user._id },
    });

    return res.status(200).json({
        message: "Escrow hold extended",
        escrowId: escrow._id,
        holdUntil,
    });
};

// @desc    Admin override to mark escrow releasable
// @route   POST /api/payments/escrow/:escrowId/override-release-approval
// @access  Private/Admin
export const overrideEscrowReleaseApproval = async (req, res) => {
    const { escrowId } = req.params;
    const { reason } = req.body;

    const escrow = await Escrow.findById(escrowId);
    if (!escrow) {
        return res.status(404).json({ message: "Escrow not found" });
    }

    if (["RELEASED", "CANCELLED", "REFUNDED"].includes(escrow.state)) {
        return res.status(400).json({ message: `Cannot override escrow in state ${escrow.state}` });
    }

    await Escrow.updateOne(
        { _id: escrow._id },
        {
            $set: {
                state: "RELEASE_APPROVED",
                metadata: {
                    ...(escrow.metadata || {}),
                    adminReleaseOverrideAt: new Date(),
                    adminReleaseOverrideBy: req.user._id,
                    adminReleaseOverrideReason: reason || null,
                },
            },
        }
    );

    await Dispute.updateMany(
        { escrow: escrow._id, status: "OPEN" },
        {
            $set: {
                status: "REJECTED",
                resolutionAction: "RELEASE",
                resolutionNote: reason || "Admin release override",
                resolvedBy: req.user._id,
                resolvedAt: new Date(),
            },
        }
    );

    return res.status(200).json({
        message: "Escrow marked as release approved",
        escrowId: escrow._id,
        state: "RELEASE_APPROVED",
    });
};
