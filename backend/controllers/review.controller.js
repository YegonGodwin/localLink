import Booking from "../models/Booking.model.js";
import Review from "../models/Review.model.js";
import Service from "../models/Service.model.js";

const updateServiceReviewStats = async (serviceId) => {
    const stats = await Review.aggregate([
        { $match: { service: serviceId } },
        {
            $group: {
                _id: "$service",
                avgRating: { $avg: "$rating" },
                reviewCount: { $sum: 1 },
            },
        },
    ]);

    const service = await Service.findById(serviceId);
    if (!service) {
        return;
    }

    if (!stats.length) {
        service.rating = 0;
        service.reviews = 0;
    } else {
        service.rating = Number(stats[0].avgRating.toFixed(1));
        service.reviews = stats[0].reviewCount;
    }

    await service.save();
};

// @desc    Create a booking review
// @route   POST /api/reviews
// @access  Private/Consumer
export const createReview = async (req, res) => {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId) {
        res.status(400);
        throw new Error("bookingId is required");
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        res.status(400);
        throw new Error("rating must be an integer between 1 and 5");
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        res.status(404);
        throw new Error("Booking not found");
    }

    if (booking.consumer.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Only the booking consumer can leave a review");
    }

    if (booking.status !== "COMPLETED") {
        res.status(400);
        throw new Error("You can only review completed bookings");
    }

    const existingReview = await Review.findOne({ booking: booking._id });
    if (existingReview) {
        res.status(409);
        throw new Error("This booking has already been reviewed");
    }

    let review;
    try {
        review = await Review.create({
            booking: booking._id,
            service: booking.service,
            provider: booking.provider,
            consumer: booking.consumer,
            rating,
            comment: comment || "",
        });
    } catch (error) {
        if (error?.code === 11000) {
            res.status(409);
            throw new Error("This booking has already been reviewed");
        }
        throw error;
    }

    await updateServiceReviewStats(booking.service);

    const populatedReview = await Review.findById(review._id)
        .populate("consumer", "name avatar")
        .populate("provider", "name avatar")
        .populate("service", "title image");

    res.status(201).json(populatedReview);
};

// @desc    Get reviews for a service
// @route   GET /api/reviews/service/:serviceId
// @access  Public
export const getServiceReviews = async (req, res) => {
    const reviews = await Review.find({ service: req.params.serviceId })
        .populate("consumer", "name avatar")
        .sort({ createdAt: -1 });

    res.json(reviews);
};

// @desc    Get reviews for a provider (all their services)
// @route   GET /api/reviews/provider/:providerId
// @access  Public
export const getProviderReviews = async (req, res) => {
    const reviews = await Review.find({ provider: req.params.providerId })
        .populate("consumer", "name avatar")
        .populate("service", "title image")
        .sort({ createdAt: -1 });

    res.json(reviews);
};
