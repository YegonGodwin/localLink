import Transaction from "../models/Transaction.model.js";

// @desc    Get all transactions (for admin) or my transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
    let query = {};

    if (req.user.role !== "ADMIN") {
        query = { user: req.user._id };
    }

    const transactions = await Transaction.find(query).populate("user", "name email");
    res.json(transactions);
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = async (req, res) => {
    const transaction = await Transaction.findById(req.params.id).populate("user", "name email");

    if (transaction) {
        if (transaction.user._id.toString() !== req.user._id.toString() && req.user.role !== "ADMIN") {
            res.status(401);
            throw new Error("Not authorized to view this transaction");
        }
        res.json(transaction);
    } else {
        res.status(404);
        throw new Error("Transaction not found");
    }
};

// @desc    Create a transaction (usually triggered by payment)
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
    const { amount, description, status } = req.body;

    const transaction = new Transaction({
        user: req.user._id,
        amount,
        description,
        status: status || "PENDING",
    });

    const createdTransaction = await transaction.save();
    res.status(201).json(createdTransaction);
};
