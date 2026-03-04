import Order from "../models/Order.model.js";

const canAccessOrder = (order, user) => {
    if (!order || !user) return false;
    if (user.role === "ADMIN") return true;
    const userId = user._id.toString();
    return (
        order.consumer?.toString() === userId ||
        order.provider?.toString() === userId
    );
};

// @desc    Get orders for the current user
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
    const query = {};

    if (req.user.role !== "ADMIN") {
        query.$or = [
            { consumer: req.user._id },
            { provider: req.user._id },
        ];
    }

    if (req.query.status) {
        query.status = req.query.status;
    }

    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("consumer", "name email avatar")
        .populate("provider", "name email avatar")
        .populate("paymentTransaction", "status amount checkoutRequestId merchantRequestId createdAt")
        .populate({
            path: "bookingIds",
            select: "status price date serviceTitleSnapshot unitPriceSnapshot createdAt updatedAt",
            populate: [
                { path: "service", select: "title category image" },
                { path: "provider", select: "name avatar" },
                { path: "consumer", select: "name avatar" },
            ],
        });

    res.json(orders);
};

// @desc    Get an order by id
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate("consumer", "name email avatar")
        .populate("provider", "name email avatar")
        .populate("paymentTransaction", "status amount checkoutRequestId merchantRequestId createdAt resultCode resultDesc")
        .populate({
            path: "bookingIds",
            populate: [
                { path: "service", select: "title category image" },
                { path: "provider", select: "name avatar" },
                { path: "consumer", select: "name avatar" },
            ],
        });

    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }

    if (!canAccessOrder(order, req.user)) {
        res.status(403);
        throw new Error("Not authorized to view this order");
    }

    res.json(order);
};

