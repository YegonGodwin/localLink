import mongoose from "mongoose";
import Booking from "../models/Booking.model.js";
import Service from "../models/Service.model.js";
import Transaction from "../models/Transaction.model.js";

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

const createBookingsForTransaction = async (transaction) => {
    if (!transaction?.services?.length) return;
    const services = await Service.find({ _id: { $in: transaction.services } });
    if (!services.length) return;

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const bookingDocs = services.map((service) => ({
                service: service._id,
                consumer: transaction.user,
                provider: service.provider,
                date: new Date(),
                price: service.price,
            }));

            const createdBookings = await Booking.insertMany(bookingDocs, { session });

            const escrowTransactions = createdBookings.map((booking) => ({
                booking: booking._id,
                user: booking.provider,
                amount: booking.price,
                status: "PENDING",
                description: `Escrow for Booking #${booking._id.toString().slice(-6).toUpperCase()}`,
            }));

            if (escrowTransactions.length > 0) {
                await Transaction.insertMany(escrowTransactions, { session });
            }

            await Transaction.updateOne(
                { _id: transaction._id },
                { $set: { bookingCreated: true } },
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

    if (transaction.status === "COMPLETED" || transaction.status === "FAILED") {
        return res.status(200).json({ message: "Callback already processed" });
    }

    const metadata = extractCallbackMetadata(callback);
    const isSuccess = Number(callback.ResultCode) === 0;

    transaction.status = isSuccess ? "COMPLETED" : "FAILED";
    transaction.resultCode = callback.ResultCode;
    transaction.resultDesc = callback.ResultDesc;
    transaction.mpesaReceiptNumber = metadata.MpesaReceiptNumber || null;
    transaction.metadata = metadata;
    transaction.rawCallback = callback;

    await transaction.save();

    if (isSuccess && !transaction.bookingCreated) {
        try {
            await createBookingsForTransaction(transaction);
        } catch (error) {
            console.error("Failed to create bookings for transaction:", error);
        }
    }

    res.status(200).json({ message: "Callback received" });
};
