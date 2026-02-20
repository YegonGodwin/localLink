import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const testCompleteEscrowFlow = async () => {
    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║        Escrow & B2C Payout Flow Test                  ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        // Import models
        const Escrow = (await import('./models/Escrow.model.js')).default;
        const Booking = (await import('./models/Booking.model.js')).default;
        const User = (await import('./models/User.model.js')).default;
        const Payout = (await import('./models/Payout.model.js')).default;

        // Check B2C configuration
        const shortcode = process.env.MPESA_B2C_SHORTCODE || process.env.MPESA_SHORTCODE;
        const initiatorName = process.env.MPESA_B2C_INITIATOR_NAME;
        const securityCredential = process.env.MPESA_B2C_SECURITY_CREDENTIAL;
        const resultUrl = process.env.MPESA_B2C_RESULT_URL;
        const timeoutUrl = process.env.MPESA_B2C_TIMEOUT_URL;

        const isDevFallback = process.env.MPESA_ENV !== "production" &&
            (!shortcode || !initiatorName || !securityCredential || !resultUrl || !timeoutUrl);

        console.log("=== Configuration ===");
        console.log("Environment:", process.env.MPESA_ENV || "sandbox");
        console.log("B2C Mode:", isDevFallback ? "Dev Fallback (Auto-approve)" : "Real M-Pesa API");
        console.log("Escrow Hold Time:", process.env.ESCROW_AUTO_RELEASE_HOURS || "48", "hours");
        console.log("Escrow Jobs:", process.env.ESCROW_JOBS_ENABLED === "true" ? "Enabled" : "Disabled");
        console.log("");

        // Find escrows in different states
        console.log("=== Escrow Status ===");
        const escrowStats = await Escrow.aggregate([
            { $group: { _id: '$state', count: { $sum: 1 }, totalAmount: { $sum: '$netAmount' } } },
            { $sort: { count: -1 } }
        ]);

        if (escrowStats.length === 0) {
            console.log("No escrows found in database");
            console.log("\n💡 To test the flow:");
            console.log("1. Make a payment as a consumer (STK push)");
            console.log("2. Mark the booking as COMPLETED");
            console.log("3. Wait for escrow hold period to elapse");
            console.log("4. Payout will be triggered automatically\n");
            return;
        }

        console.log("Escrow states:");
        escrowStats.forEach(s => {
            console.log(`  ${s._id}: ${s.count} escrow(s), Total: KES ${s.totalAmount.toFixed(2)}`);
        });
        console.log("");

        // Find a specific escrow to test
        const testEscrow = await Escrow.findOne({
            state: { $in: ['HELD', 'RELEASE_APPROVED', 'RELEASING'] }
        }).populate('booking').populate('provider').populate('consumer');

        if (!testEscrow) {
            console.log("⚠️  No escrows in testable state (HELD, RELEASE_APPROVED, or RELEASING)");
            console.log("\nCurrent escrows:");
            const allEscrows = await Escrow.find().limit(5).populate('booking');
            allEscrows.forEach(e => {
                console.log(`  - ${e._id}: ${e.state} (KES ${e.netAmount})`);
            });
            console.log("");
            return;
        }

        console.log("=== Test Escrow Details ===");
        console.log("Escrow ID:", testEscrow._id);
        console.log("State:", testEscrow.state);
        console.log("Booking ID:", testEscrow.booking?._id);
        console.log("Booking Status:", testEscrow.booking?.status);
        console.log("Provider:", testEscrow.provider?.name || testEscrow.provider);
        console.log("Consumer:", testEscrow.consumer?.name || testEscrow.consumer);
        console.log("Gross Amount:", `KES ${testEscrow.grossAmount}`);
        console.log("Commission:", `KES ${testEscrow.commissionAmount} (${testEscrow.commissionValue}${testEscrow.commissionType === 'PERCENTAGE' ? '%' : ''})`);
        console.log("Net Amount:", `KES ${testEscrow.netAmount}`);
        console.log("Hold Until:", testEscrow.holdUntil);
        console.log("");

        // Check provider phone
        const provider = await User.findById(testEscrow.provider);
        if (!provider?.phone) {
            console.log("❌ Provider has no phone number!");
            console.log("Add a phone number to test B2C payout");
            console.log("");
            return;
        }
        console.log("Provider Phone:", provider.phone);
        console.log("");

        // Check if hold period has elapsed
        const now = new Date();
        const holdElapsed = now >= testEscrow.holdUntil;

        console.log("=== Hold Period Check ===");
        console.log("Current Time:", now.toISOString());
        console.log("Hold Until:", testEscrow.holdUntil.toISOString());
        console.log("Status:", holdElapsed ? "✅ Elapsed" : "⏳ Waiting");
        
        if (!holdElapsed) {
            const remainingMs = testEscrow.holdUntil - now;
            const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);
            console.log("Remaining:", remainingMinutes, "minute(s)");
        }
        console.log("");

        // Check booking status
        if (testEscrow.booking?.status !== 'COMPLETED') {
            console.log("⚠️  Booking is not COMPLETED yet");
            console.log("Current status:", testEscrow.booking?.status);
            console.log("\n💡 To proceed:");
            console.log(`PUT /api/bookings/${testEscrow.booking?._id}/status`);
            console.log(`Body: { "status": "COMPLETED" }`);
            console.log("");
            return;
        }

        // Check payout history
        const payouts = await Payout.find({ escrow: testEscrow._id }).sort({ createdAt: -1 });
        if (payouts.length > 0) {
            console.log("=== Payout History ===");
            payouts.forEach(p => {
                console.log(`  ${p.status}: KES ${p.amount} (${p.createdAt.toISOString()})`);
                if (p.resultDesc) console.log(`    ${p.resultDesc}`);
            });
            console.log("");
        }

        // Provide next steps
        console.log("=== Next Steps ===");
        
        if (testEscrow.state === 'HELD' && !holdElapsed) {
            console.log("⏳ Wait for hold period to elapse, or manually trigger release:");
            console.log(`   POST /api/payments/escrow/${testEscrow._id}/release`);
        } else if (testEscrow.state === 'HELD' && holdElapsed) {
            console.log("✅ Ready for auto-release approval");
            console.log("   The escrow job will automatically approve it");
            console.log("   Or manually trigger:");
            console.log(`   POST /api/payments/escrow/process-auto-release`);
        } else if (testEscrow.state === 'RELEASE_APPROVED') {
            console.log("✅ Ready for payout");
            console.log("   The release queue job will automatically process it");
            console.log("   Or manually trigger:");
            console.log(`   POST /api/payments/escrow/${testEscrow._id}/release`);
        } else if (testEscrow.state === 'RELEASING') {
            console.log("⏳ Payout in progress");
            console.log("   Waiting for M-Pesa callback");
        } else if (testEscrow.state === 'RELEASED') {
            console.log("✅ Payout completed!");
        }
        console.log("");

        if (isDevFallback) {
            console.log("💡 Dev Fallback Mode is active");
            console.log("   Payouts will be auto-approved without calling M-Pesa");
            console.log("   Perfect for testing the complete flow!");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error);
    } finally {
        await mongoose.disconnect();
        console.log("\n✅ Disconnected from MongoDB\n");
    }
};

testCompleteEscrowFlow().catch(console.error);
