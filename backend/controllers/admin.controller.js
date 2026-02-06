import User from "../models/User.model.js";
import Transaction from "../models/Transaction.model.js";

// @desc    Admin overview metrics
// @route   GET /api/admin/overview
// @access  Private/Admin
export const getAdminOverview = async (req, res) => {
    const [totalUsers, activeUsers, pendingTransactions] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: "ACTIVE" }),
        Transaction.countDocuments({ status: "PENDING" }),
    ]);

    const volumeAgg = await Transaction.aggregate([
        { $match: { status: "COMPLETED" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalVolume = volumeAgg.length ? volumeAgg[0].total : 0;

    const recentTransactions = await Transaction.find()
        .sort({ date: -1, createdAt: -1 })
        .limit(8)
        .populate("user", "name email");

    res.json({
        totalUsers,
        activeUsers,
        pendingTransactions,
        totalVolume,
        recentTransactions: recentTransactions.map((tx) => ({
            id: tx._id,
            date: tx.date || tx.createdAt,
            amount: tx.amount,
            status: tx.status,
            description: tx.description,
            user: tx.user?.name || "User",
        })),
    });
};

// @desc    Admin users list
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAdminUsers = async (req, res) => {
    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.status) query.status = req.query.status;
    if (req.query.verified !== undefined) {
        query.verified = req.query.verified === "true";
    }
    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    res.json(users);
};

// @desc    Update user status (admin only)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req, res) => {
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    if (!["ACTIVE", "SUSPENDED"].includes(status)) {
        res.status(400);
        throw new Error("Invalid status");
    }
    user.status = status;
    await user.save();
    res.json({ id: user._id, status: user.status });
};
