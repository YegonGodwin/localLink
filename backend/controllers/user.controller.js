import User from "../models/User.model.js";
import generateToken from "../utils/generateToken.js";

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
        res.json(provider);
    } else {
        res.status(404);
        throw new Error("Provider not found");
    }
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
