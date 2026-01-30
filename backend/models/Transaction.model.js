import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
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
            enum: ["COMPLETED", "PENDING", "FAILED"],
            default: "PENDING",
        },
        description: {
            type: String,
            required: true,
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
