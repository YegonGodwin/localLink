import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
    {
        escrow: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Escrow",
            index: true,
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            required: true,
            enum: ["PENDING", "PROCESSING", "SUCCESS", "FAILED"],
            default: "PENDING",
        },
        paymentProvider: {
            type: String,
            default: "MPESA_B2C",
        },
        originatorConversationId: {
            type: String,
            default: null,
            index: true,
        },
        conversationId: {
            type: String,
            default: null,
            index: true,
        },
        resultCode: {
            type: Number,
            default: null,
        },
        resultDesc: {
            type: String,
            default: null,
        },
        rawCallback: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Payout = mongoose.model("Payout", payoutSchema);

export default Payout;
