import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.model.js";

dotenv.config();

const adminEmail = process.env.ADMIN_EMAIL || "admin@locallink.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
const adminName = process.env.ADMIN_NAME || "Admin User";

const run = async () => {
    try {
        await connectDB();

        let admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            admin = await User.create({
                name: adminName,
                email: adminEmail,
                password: adminPassword,
                role: "ADMIN",
                verified: true,
                status: "ACTIVE",
            });
            console.log(`Admin created: ${admin.email}`);
        } else {
            admin.name = adminName;
            admin.role = "ADMIN";
            admin.verified = true;
            admin.status = "ACTIVE";
            admin.password = adminPassword;
            await admin.save();
            console.log(`Admin updated: ${admin.email}`);
        }

        process.exit(0);
    } catch (error) {
        console.error("Failed to seed admin:", error);
        process.exit(1);
    }
};

run();
