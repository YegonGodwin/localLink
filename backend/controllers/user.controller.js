import User from "../models/User.model.js";
import ProviderLike from "../models/ProviderLike.model.js";
import generateToken from "../utils/generateToken.js";

const KB = 1024;
const MB = 1024 * KB;
const MAX_PROFILE_MEDIA_BYTES = 8 * MB;
const MAX_PORTFOLIO_ITEMS = 8;

const getStoredStringSize = (value = "") => {
    if (!value || typeof value !== "string") {
        return 0;
    }

    if (!value.startsWith("data:")) {
        return Buffer.byteLength(value, "utf8");
    }

    const base64 = value.split(",")[1] || "";
    const padding = base64.match(/=*$/)?.[0].length ?? 0;
    return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
};

const validateProfileMedia = ({ avatar, coverImage, portfolio }) => {
    const normalizedPortfolio = Array.isArray(portfolio) ? portfolio : [];

    if (normalizedPortfolio.length > MAX_PORTFOLIO_ITEMS) {
        return `You can upload up to ${MAX_PORTFOLIO_ITEMS} portfolio images.`;
    }

    const totalBytes =
        getStoredStringSize(avatar) +
        getStoredStringSize(coverImage) +
        normalizedPortfolio.reduce((total, item) => total + getStoredStringSize(item), 0);

    if (totalBytes > MAX_PROFILE_MEDIA_BYTES) {
        return "Your profile images are too large to save together. Use fewer portfolio images or smaller files.";
    }

    return null;
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            verified: user.verified,
            status: user.status,
            tagline: user.tagline,
            bio: user.bio,
            phone: user.phone,
            address: user.address,
            category: user.category,
            website: user.website,
            coverImage: user.coverImage,
            portfolio: user.portfolio,
            location: user.location
        });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        const nextProfileMedia = {
            avatar: typeof req.body.avatar === "string" ? req.body.avatar : user.avatar,
            coverImage: typeof req.body.coverImage === "string" ? req.body.coverImage : user.coverImage,
            portfolio: Array.isArray(req.body.portfolio) ? req.body.portfolio : user.portfolio,
        };
        const profileMediaError = validateProfileMedia(nextProfileMedia);

        if (profileMediaError) {
            res.status(400);
            throw new Error(profileMediaError);
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.avatar = req.body.avatar || user.avatar;
        user.tagline = req.body.tagline || user.tagline;
        user.bio = req.body.bio || user.bio;
        user.phone = req.body.phone || user.phone;
        user.address = req.body.address || user.address;
        user.category = req.body.category || user.category;
        user.website = req.body.website || user.website;
        user.coverImage = req.body.coverImage || user.coverImage;
        user.portfolio = req.body.portfolio || user.portfolio;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
            tagline: updatedUser.tagline,
            bio: updatedUser.bio,
            phone: updatedUser.phone,
            address: updatedUser.address,
            category: updatedUser.category,
            website: updatedUser.website,
            coverImage: updatedUser.coverImage,
            portfolio: updatedUser.portfolio,
            location: updatedUser.location,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
};

// @desc    Get all providers
// @route   GET /api/users/providers
// @access  Public
export const getProviders = async (req, res) => {
    const providers = await User.find({ role: "PROVIDER" }).select("-password");
    res.json(providers);
};

// @desc    Get provider by ID
// @route   GET /api/users/providers/:id
// @access  Public
export const getProviderById = async (req, res) => {
    const provider = await User.findOne({ _id: req.params.id, role: "PROVIDER" }).select("-password");

    if (provider) {
        const likesCount = await ProviderLike.countDocuments({ provider: provider._id });
        res.json({
            ...provider.toObject(),
            likesCount,
        });
    } else {
        res.status(404);
        throw new Error("Provider not found");
    }
};

// @desc    Get like status for a provider profile
// @route   GET /api/users/providers/:id/like-status
// @access  Private/Consumer
export const getProviderLikeStatus = async (req, res) => {
    const provider = await User.findOne({ _id: req.params.id, role: "PROVIDER" }).select("_id");
    if (!provider) {
        res.status(404);
        throw new Error("Provider not found");
    }

    const likesCount = await ProviderLike.countDocuments({ provider: provider._id });
    const liked = Boolean(
        await ProviderLike.findOne({
            provider: provider._id,
            consumer: req.user._id,
        }).select("_id")
    );

    res.json({ liked, likesCount });
};

// @desc    Toggle like/unlike for a provider profile
// @route   POST /api/users/providers/:id/like
// @access  Private/Consumer
export const toggleProviderLike = async (req, res) => {
    if (req.user.role !== "CONSUMER") {
        res.status(403);
        throw new Error("Only consumers can like provider profiles");
    }

    const provider = await User.findOne({ _id: req.params.id, role: "PROVIDER" }).select("_id");
    if (!provider) {
        res.status(404);
        throw new Error("Provider not found");
    }

    let liked = false;
    const existingLike = await ProviderLike.findOne({
        provider: provider._id,
        consumer: req.user._id,
    });

    if (existingLike) {
        await existingLike.deleteOne();
        liked = false;
    } else {
        await ProviderLike.create({
            provider: provider._id,
            consumer: req.user._id,
        });
        liked = true;
    }

    const likesCount = await ProviderLike.countDocuments({ provider: provider._id });
    res.json({ liked, likesCount });
};

// @desc    Get any user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error("User not found");
    }
};
