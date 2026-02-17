import mongoose from "mongoose";

const providerLikeSchema = new mongoose.Schema(
    {
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        consumer: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

providerLikeSchema.index({ provider: 1, consumer: 1 }, { unique: true });
providerLikeSchema.index({ provider: 1, createdAt: -1 });

const ProviderLike = mongoose.model("ProviderLike", providerLikeSchema);

export default ProviderLike;
