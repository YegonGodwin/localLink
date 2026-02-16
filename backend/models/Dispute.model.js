import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
    {
        escrow: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Escrow",
            index: true,
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Booking",
            index: true,
        },
        raisedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        raisedByRole: {
            type: String,
            enum: ["CONSUMER", "PROVIDER", "ADMIN"],
            required: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        evidence: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        status: {
            type: String,
            enum: ["OPEN", "RESOLVED", "REJECTED"],
            default: "OPEN",
            index: true,
        },
        resolutionAction: {
            type: String,
            enum: ["RELEASE", "CANCEL", "KEEP_HOLD"],
            default: null,
        },
        resolutionNote: {
            type: String,
            default: null,
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Dispute = mongoose.model("Dispute", disputeSchema);

export default Dispute;
