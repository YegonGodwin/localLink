import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Booking",
            unique: true,
        },
        service: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Service",
        },
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
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            default: "",
            trim: true,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
    }
);

reviewSchema.index({ service: 1, createdAt: -1 });
reviewSchema.index({ provider: 1, createdAt: -1 });
reviewSchema.index({ consumer: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
