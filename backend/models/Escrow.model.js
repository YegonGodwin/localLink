import mongoose from "mongoose";

const escrowSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Booking",
            index: true,
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
            index: true,
        },
        consumerPaymentTransaction: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Transaction",
            index: true,
        },
        providerEscrowTransaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            default: null,
        },
        grossAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        commissionAmount: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        netAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        commissionType: {
            type: String,
            enum: ["PERCENTAGE", "FIXED"],
            default: "PERCENTAGE",
        },
        commissionValue: {
            type: Number,
            default: 0,
            min: 0,
        },
        holdUntil: {
            type: Date,
            required: true,
            index: true,
        },
        releasedAt: {
            type: Date,
            default: null,
        },
        state: {
            type: String,
            required: true,
            enum: [
                "HELD",
                "RELEASE_APPROVED",
                "RELEASING",
                "RELEASED",
                "DISPUTED",
                "CANCELLED",
                "REFUNDED",
                "PAYOUT_FAILED",
            ],
            default: "HELD",
            index: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Escrow = mongoose.model("Escrow", escrowSchema);

export default Escrow;
