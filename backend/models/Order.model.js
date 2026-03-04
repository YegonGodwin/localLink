import mongoose from "mongoose";

const orderServiceSnapshotSchema = new mongoose.Schema(
    {
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            default: null,
        },
        unitPrice: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        consumer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        services: {
            type: [orderServiceSnapshotSchema],
            default: [],
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "KES",
        },
        status: {
            type: String,
            enum: [
                "INITIATED",
                "PAYMENT_PENDING",
                "PAYMENT_COMPLETED",
                "BOOKINGS_CREATED",
                "FAILED",
                "CANCELLED",
            ],
            default: "INITIATED",
            index: true,
        },
        paymentTransaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            default: null,
        },
        bookingIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Booking",
            },
        ],
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;

