import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["CONSUMER", "PROVIDER", "ADMIN"],
            default: "CONSUMER",
        },
        avatar: {
            type: String,
            default: "",
        },
        verified: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "SUSPENDED"],
            default: "ACTIVE",
        },
        location: {
            type: String,
        },
        // Provider Profile Fields
        tagline: {
            type: String,
        },
        bio: {
            type: String,
        },
        phone: {
            type: String,
        },
        address: {
            type: String,
        },
        category: {
            type: String,
        },
        website: {
            type: String,
        },
        coverImage: {
            type: String,
        },
        portfolio: [
            {
                type: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;
