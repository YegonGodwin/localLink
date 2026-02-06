import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
    {
        platformFee: {
            type: Number,
            default: 5,
        },
        supportEmail: {
            type: String,
            default: "support@locallink.com",
        },
        maintenanceMode: {
            type: Boolean,
            default: false,
        },
        termsUrl: {
            type: String,
            default: "",
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
