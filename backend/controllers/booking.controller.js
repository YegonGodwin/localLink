import Booking from "../models/Booking.model.js";
import Service from "../models/Service.model.js";
import Transaction from "../models/Transaction.model.js";
import mongoose from 'mongoose';
import { syncEscrowStateForBookingStatus } from "../services/escrow.service.js";
import { getIO } from "../sockets/io.instance.js";

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
    const io = getIO();

    // Create a pending transaction for the provider (escrowed until completion)
    // and a completed transaction for the consumer payment. Use a mongoose
    // session so both inserts commit or rollback together. If sessions aren't
    // available, fall back to a compensation delete of the first transaction
    // if the second fails.
    try {
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                await Transaction.create([
                    {
                        booking: createdBooking._id,
                        user: service.provider,
                        amount: price,
                        status: "PENDING",
                        description: `Escrow for Booking #${createdBooking._id.toString().slice(-6).toUpperCase()}`,
                    }
                ], { session });

                await Transaction.create({
                    booking: createdBooking._id,
                    user: req.user._id,
                    amount: price,
                    status: "COMPLETED",
                    description: `Payment for ${service.title}`,
                }, { session });
            });
        } finally {
            session.endSession();
        }
    } catch (txError) {
        // Fallback: attempt to create both without a session but compensate
        // by deleting the first transaction if the second fails.
        try {
            const t1 = await Transaction.create({
                booking: createdBooking._id,
                user: service.provider,
                amount: price,
                status: "PENDING",
                description: `Escrow for Booking #${createdBooking._id.toString().slice(-6).toUpperCase()}`,
            });
            try {
                await Transaction.create({
                    booking: createdBooking._id,
                    user: req.user._id,
                    amount: price,
                    status: "COMPLETED",
                    description: `Payment for ${service.title}`,
                });
            } catch (secondErr) {
                // remove the first transaction to avoid partial state
                try {
                    await Transaction.deleteOne({ _id: t1._id });
                } catch (delErr) {
                    console.error('Failed to rollback first transaction after second failed:', delErr);
                }
                throw secondErr;
            }
        } catch (finalErr) {
            console.error("Failed to create transactions for booking:", finalErr);
        }
    }

    if (io) {
        const providerRoom = service.provider?.toString?.();
        const createdAt = createdBooking.createdAt?.toISOString?.() || new Date().toISOString();
        const bookingPayload = {
            bookingId: createdBooking._id?.toString(),
            status: createdBooking.status,
            updatedAt: createdAt,
            providerName: service.provider?.name || "Provider",
            consumerName: req.user?.name || "Consumer",
            serviceTitle: service.title || "Service",
        };

        if (providerRoom) {
            io.to(providerRoom).emit("booking:status", bookingPayload);
            io.to(providerRoom).emit("notification:new", {
                id: `booking-${bookingPayload.bookingId}-PENDING-${createdAt}`,
                type: "booking",
                title: "New service request",
                description: `${bookingPayload.serviceTitle} requested by ${bookingPayload.consumerName}`,
                timestamp: createdAt,
                targetView: "requests",
            });
        }
    }

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

        const nextStatus = status || booking.status;
        booking.status = nextStatus;
        const updatedBooking = await booking.save();
        const io = getIO();
        const escrow = await syncEscrowStateForBookingStatus({
            bookingId: booking._id,
            bookingStatus: nextStatus,
            actorId: req.user._id,
        });

        if (status === "COMPLETED" || status === "CANCELLED") {
            const isEscrowFlow = Boolean(escrow);
            const providerTxStatus = status === "COMPLETED" ? "COMPLETED" : "FAILED";
            const consumerTxStatus = status === "CANCELLED" ? "REFUNDED" : providerTxStatus;
            try {
                if (isEscrowFlow) {
                    if (status === "CANCELLED") {
                        await Transaction.findOneAndUpdate(
                            { booking: booking._id, escrow: escrow._id, user: booking.provider },
                            {
                                $set: {
                                    status: "FAILED",
                                    amount: escrow.netAmount,
                                    description: `Escrow hold cancelled for Booking #${booking._id.toString().slice(-6).toUpperCase()}`,
                                },
                            },
                            { upsert: false, new: true }
                        );
                    }
                } else {
                    await Transaction.findOneAndUpdate(
                        { booking: booking._id, user: booking.provider },
                        {
                            $set: {
                                status: providerTxStatus,
                                amount: booking.price,
                                description: `Escrow for Booking #${booking._id.toString().slice(-6).toUpperCase()}`,
                            },
                        },
                        { upsert: true, new: true }
                    );
                }

                // attempt to include the original service title in the consumer description
                let serviceTitle = 'service';
                try {
                    const svc = await Service.findById(booking.service);
                    if (svc && svc.title) serviceTitle = svc.title;
                } catch (svcErr) {
                    // ignore and fall back to generic
                }

                if (!isEscrowFlow || status === "CANCELLED") {
                    await Transaction.findOneAndUpdate(
                        { booking: booking._id, user: booking.consumer },
                        {
                            $set: {
                                status: consumerTxStatus,
                                amount: booking.price,
                                description: `Payment for ${serviceTitle}`,
                            },
                        },
                        { upsert: !isEscrowFlow, new: true }
                    );
                }
            } catch (error) {
                console.error("Failed to update transaction for booking:", error);
            }
        }

        if (io) {
            const populatedBooking = await Booking.findById(updatedBooking._id)
                .populate("provider", "name")
                .populate("consumer", "name")
                .populate("service", "title");

            if (populatedBooking) {
                const bookingPayload = {
                    bookingId: populatedBooking._id?.toString(),
                    status: populatedBooking.status,
                    updatedAt: populatedBooking.updatedAt?.toISOString?.() || new Date().toISOString(),
                    providerName: populatedBooking.provider?.name || "Provider",
                    consumerName: populatedBooking.consumer?.name || "Consumer",
                    serviceTitle: populatedBooking.service?.title || "Service",
                };

                const statusTitles = {
                    IN_PROGRESS: "Service request accepted",
                    COMPLETED: "Service marked as completed",
                    CANCELLED: "Service request cancelled",
                };
                const providerStatusTitles = {
                    IN_PROGRESS: "Job moved to in progress",
                    COMPLETED: "Job marked as completed",
                    CANCELLED: "Job was cancelled",
                };

                const statusTitle = statusTitles[bookingPayload.status];
                const providerStatusTitle = providerStatusTitles[bookingPayload.status];
                const consumerRoom = populatedBooking.consumer?._id?.toString();
                const providerRoom = populatedBooking.provider?._id?.toString();

                if (consumerRoom) {
                    io.to(consumerRoom).emit("booking:status", bookingPayload);
                    if (statusTitle) {
                        io.to(consumerRoom).emit("notification:new", {
                            id: `booking-${bookingPayload.bookingId}-${bookingPayload.status}-${bookingPayload.updatedAt}`,
                            type: "booking",
                            title: statusTitle,
                            description: `${bookingPayload.serviceTitle} with ${bookingPayload.providerName}`,
                            timestamp: bookingPayload.updatedAt,
                            targetView: "requests",
                        });
                    }
                }

                if (providerRoom) {
                    io.to(providerRoom).emit("booking:status", bookingPayload);
                    if (providerStatusTitle) {
                        io.to(providerRoom).emit("notification:new", {
                            id: `booking-provider-${bookingPayload.bookingId}-${bookingPayload.status}-${bookingPayload.updatedAt}`,
                            type: "booking",
                            title: providerStatusTitle,
                            description: `${bookingPayload.serviceTitle} with ${bookingPayload.consumerName}`,
                            timestamp: bookingPayload.updatedAt,
                            targetView: "requests",
                        });
                    }
                }
            }
        }

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
