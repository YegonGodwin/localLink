import mongoose from "mongoose";

const ledgerEntrySchema = new mongoose.Schema(
    {
        escrow: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Escrow",
            default: null,
            index: true,
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            default: null,
            index: true,
        },
        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            default: null,
        },
        entryType: {
            type: String,
            required: true,
            enum: [
                "CUSTOMER_PAYMENT_RECEIVED",
                "ESCROW_HOLD_RECORDED",
                "COMMISSION_RECOGNIZED",
                "PROVIDER_PAYOUT_INITIATED",
                "PROVIDER_PAYOUT_COMPLETED",
                "REFUND_ISSUED",
                "ADJUSTMENT",
            ],
        },
        direction: {
            type: String,
            required: true,
            enum: ["DEBIT", "CREDIT"],
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "KES",
        },
        description: {
            type: String,
            required: true,
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

const LedgerEntry = mongoose.model("LedgerEntry", ledgerEntrySchema);

export default LedgerEntry;
