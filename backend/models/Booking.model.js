import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        service: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Service",
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
            index: true,
        },
        consumer: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        date: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            default: "PENDING",
        },
        price: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "KES",
        },
        serviceTitleSnapshot: {
            type: String,
            default: null,
        },
        unitPriceSnapshot: {
            type: Number,
            default: null,
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        cancellationReason: {
            type: String,
            default: null,
        },
        statusHistory: [
            {
                from: { type: String, default: null },
                to: { type: String, required: true },
                actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
                actorRole: { type: String, default: null },
                reason: { type: String, default: null },
                at: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
