import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        service: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Service",
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
    },
    {
        timestamps: true,
    }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
