import crypto from "crypto";
import User from "../models/User.model.js";
import generateToken from "../utils/generateToken.js";
import { validateRegistration } from "../utils/validators.js";
import { sendVerificationEmail } from "../services/email.service.js";

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
        res.status(401);
        throw new Error("Invalid email or password");
    }

    if (!user.verified) {
        res.status(403);
        throw new Error("Please verify your email address before logging in");
    }

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        location: user.location,
        token: generateToken(user._id),
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    const { name, email, password, role, location } = req.body;

    const { errors, isValid } = validateRegistration({ name, email, password });

    if (!isValid) {
        res.status(400);
        return res.json({ errors });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await User.create({
        name,
        email,
        password,
        role: role || "CONSUMER",
        location,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        verified: false,
    });

    if (!user) {
        res.status(400);
        throw new Error("Invalid user data");
    }

    await sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
        message: "Registration successful. Please check your email to verify your account.",
        email: user.email,
    });
};

// @desc    Verify email address
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
        res.status(400);
        throw new Error("Invalid or expired verification link");
    }

    user.verified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully. You can now log in." });
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        // Don't reveal whether the email exists
        return res.json({ message: "If that email is registered, a new verification link has been sent." });
    }

    if (user.verified) {
        return res.json({ message: "This account is already verified." });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    try {
        await sendVerificationEmail(email, user.name, verificationToken);
    } catch (err) {
        console.error("Failed to resend verification email:", err.message);
    }

    res.json({ message: "If that email is registered, a new verification link has been sent." });
};
