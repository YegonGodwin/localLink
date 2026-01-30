import Booking from "../models/Booking.model.js";
import Service from "../models/Service.model.js";

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
    const { serviceId, date, price } = req.body;

    const service = await Service.findById(serviceId);

    if (!service) {
        res.status(404);
        throw new Error("Service not found");
    }

    const booking = new Booking({
        service: serviceId,
        consumer: req.user._id,
        provider: service.provider,
        date,
        price,
    });

    const createdBooking = await booking.save();
    res.status(201).json(createdBooking);
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate("consumer", "name email")
        .populate("provider", "name email")
        .populate("service", "title image");

    if (booking) {
        if (
            booking.consumer._id.toString() !== req.user._id.toString() &&
            booking.provider._id.toString() !== req.user._id.toString() &&
            req.user.role !== "ADMIN"
        ) {
            res.status(401);
            throw new Error("Not authorized to view this booking");
        }
        res.json(booking);
    } else {
        res.status(404);
        throw new Error("Booking not found");
    }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = async (req, res) => {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (booking) {
        if (
            booking.provider.toString() !== req.user._id.toString() &&
            booking.consumer.toString() !== req.user._id.toString() &&
            req.user.role !== "ADMIN"
        ) {
            res.status(401);
            throw new Error("Not authorized to update booking status");
        }

        booking.status = status || booking.status;
        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } else {
        res.status(404);
        throw new Error("Booking not found");
    }
};

// @desc    Get my bookings (as consumer)
// @route   GET /api/bookings/my-bookings
// @access  Private
export const getMyBookings = async (req, res) => {
    const bookings = await Booking.find({ consumer: req.user._id })
        .populate("provider", "name avatar")
        .populate("service", "title image");
    res.json(bookings);
};

// @desc    Get my jobs (as provider)
// @route   GET /api/bookings/my-jobs
// @access  Private/Provider
export const getMyJobs = async (req, res) => {
    const bookings = await Booking.find({ provider: req.user._id })
        .populate("consumer", "name avatar")
        .populate("service", "title image");
    res.json(bookings);
};
