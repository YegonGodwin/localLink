import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
            index: true,
        },
        escrow: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Escrow",
            default: null,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["COMPLETED", "PENDING", "FAILED", "REFUNDED"],
            default: "PENDING",
        },
        transactionType: {
            type: String,
            enum: [
                "CUSTOMER_PAYMENT",
                "ESCROW_HOLD",
                "PROVIDER_PAYOUT",
                "PLATFORM_COMMISSION",
                "REFUND",
                "ADJUSTMENT",
            ],
            default: "ADJUSTMENT",
        },
        description: {
            type: String,
            required: true,
        },
        paymentProvider: {
            type: String,
            default: null,
        },
        phoneNumber: {
            type: String,
            default: null,
        },
        checkoutRequestId: {
            type: String,
            default: null,
        },
        merchantRequestId: {
            type: String,
            default: null,
        },
        mpesaReceiptNumber: {
            type: String,
            default: null,
        },
        accountReference: {
            type: String,
            default: null,
        },
        resultCode: {
            type: Number,
            default: null,
        },
        resultDesc: {
            type: String,
            default: null,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        rawCallback: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        services: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Service",
            },
        ],
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        bookingCreated: {
            type: Boolean,
            default: false,
        },
        bookingCreationInProgress: {
            type: Boolean,
            default: false,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
