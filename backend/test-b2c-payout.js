import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const MPESA_BASE_URL = process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

const getAccessToken = async () => {
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    
    const auth = Buffer.from(`${key}:${secret}`).toString("base64");
    const res = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        method: "GET",
        headers: { Authorization: `Basic ${auth}` },
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) {
        throw new Error(data.errorMessage || "Failed to obtain M-Pesa access token");
    }
    return data.access_token;
};

const testB2CConfiguration = () => {
    console.log("=== M-Pesa B2C Configuration Check ===\n");

    const shortcode = process.env.MPESA_B2C_SHORTCODE || process.env.MPESA_SHORTCODE;
    const initiatorName = process.env.MPESA_B2C_INITIATOR_NAME;
    const securityCredential = process.env.MPESA_B2C_SECURITY_CREDENTIAL;
    const resultUrl = process.env.MPESA_B2C_RESULT_URL;
    const timeoutUrl = process.env.MPESA_B2C_TIMEOUT_URL;
    const commandId = process.env.MPESA_B2C_COMMAND_ID || "BusinessPayment";

    console.log("Configuration:");
    console.log("- Shortcode:", shortcode || "❌ NOT SET");
    console.log("- Initiator Name:", initiatorName || "❌ NOT SET");
    console.log("- Security Credential:", securityCredential ? `${securityCredential.substring(0, 20)}...` : "❌ NOT SET");
    console.log("- Result URL:", resultUrl || "❌ NOT SET");
    console.log("- Timeout URL:", timeoutUrl || "❌ NOT SET");
    console.log("- Command ID:", commandId);
    console.log("");

    const isDevFallback = process.env.MPESA_ENV !== "production" &&
        (!shortcode || !initiatorName || !securityCredential || !resultUrl || !timeoutUrl);

    if (isDevFallback) {
        console.log("⚠️  Dev Fallback Mode: ENABLED");
        console.log("B2C payouts will be auto-approved without calling M-Pesa API");
        console.log("");
        return { isDevFallback: true, config: null };
    }

    if (!shortcode || !initiatorName || !securityCredential || !resultUrl || !timeoutUrl) {
        console.log("❌ B2C Configuration INCOMPLETE!");
        console.log("Missing required fields. B2C payouts will fail.");
        console.log("");
        return { isDevFallback: false, config: null };
    }

    console.log("✅ B2C Configuration: COMPLETE");
    console.log("");

    return {
        isDevFallback: false,
        config: {
            shortcode,
            initiatorName,
            securityCredential,
            resultUrl,
            timeoutUrl,
            commandId,
        }
    };
};

const testB2CPayoutAPI = async (config) => {
    console.log("=== Testing B2C Payout API ===\n");

    try {
        console.log("Step 1: Getting access token...");
        const token = await getAccessToken();
        console.log("✅ Access token obtained:", `${token.substring(0, 20)}...`);
        console.log("");

        const testPhone = "254708374149"; // Safaricom test number
        const testAmount = 10; // Minimum test amount

        const payload = {
            OriginatorConversationID: `TEST-B2C-${Date.now()}`,
            InitiatorName: config.initiatorName,
            SecurityCredential: config.securityCredential,
            CommandID: config.commandId,
            Amount: testAmount,
            PartyA: config.shortcode,
            PartyB: testPhone,
            Remarks: "Test payout",
            QueueTimeOutURL: config.timeoutUrl,
            ResultURL: config.resultUrl,
            Occasion: "Testing",
        };

        console.log("Step 2: Initiating B2C payout...");
        console.log("Payload:", JSON.stringify({
            ...payload,
            SecurityCredential: `${payload.SecurityCredential.substring(0, 20)}...`,
        }, null, 2));
        console.log("");

        const res = await fetch(`${MPESA_BASE_URL}/mpesa/b2c/v3/paymentrequest`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        
        console.log("Response Status:", res.status, res.statusText);
        console.log("Response Data:", JSON.stringify(data, null, 2));
        console.log("");

        const accepted = res.ok && (data?.ResponseCode === "0" || data?.responseCode === "0");

        if (!accepted) {
            console.error("❌ B2C Payout initiation FAILED!");
            console.error("Error Code:", data?.ResponseCode || data?.errorCode);
            console.error("Error Message:", data?.ResponseDescription || data?.errorMessage);
            console.log("");
            console.log("💡 Common issues:");
            console.log("1. Security Credential must be generated for your certificate");
            console.log("2. Initiator Name must match the one in Daraja portal");
            console.log("3. Callback URLs must be registered in Daraja portal");
            console.log("4. Shortcode must support B2C transactions");
            console.log("5. Test phone number must be a valid Safaricom number");
            return false;
        }

        console.log("✅ B2C Payout initiated successfully!");
        console.log("ConversationID:", data?.ConversationID || data?.conversationID);
        console.log("OriginatorConversationID:", data?.OriginatorConversationID);
        console.log("");
        console.log("⏳ Waiting for callback to Result URL...");
        console.log("Check your ngrok logs for the callback");
        return true;

    } catch (error) {
        console.error("❌ Error testing B2C payout:", error.message);
        console.error(error);
        return false;
    }
};

const testEscrowFlow = async () => {
    console.log("=== Testing Escrow Release Flow ===\n");

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Import models
        const Escrow = (await import('./models/Escrow.model.js')).default;
        const Booking = (await import('./models/Booking.model.js')).default;
        const User = (await import('./models/User.model.js')).default;

        // Find a completed booking with escrow in RELEASE_APPROVED state
        const escrow = await Escrow.findOne({
            state: { $in: ['RELEASE_APPROVED', 'HELD'] }
        }).populate('booking').populate('provider');

        if (!escrow) {
            console.log("⚠️  No escrows found in RELEASE_APPROVED or HELD state");
            console.log("Create a booking and mark it as completed first");
            console.log("");
            
            // Show some stats
            const stats = await Escrow.aggregate([
                { $group: { _id: '$state', count: { $sum: 1 } } }
            ]);
            console.log("Escrow states in database:");
            stats.forEach(s => console.log(`  - ${s._id}: ${s.count}`));
            console.log("");
            return;
        }

        console.log("Found escrow:", {
            id: escrow._id,
            state: escrow.state,
            grossAmount: escrow.grossAmount,
            netAmount: escrow.netAmount,
            commissionAmount: escrow.commissionAmount,
            provider: escrow.provider?.name || escrow.provider,
        });
        console.log("");

        // Check if provider has phone number
        const provider = await User.findById(escrow.provider);
        if (!provider?.phone) {
            console.log("❌ Provider has no phone number set!");
            console.log("Provider ID:", escrow.provider);
            console.log("Add a phone number to the provider user");
            return;
        }

        console.log("Provider phone:", provider.phone);
        console.log("");

        // If escrow is HELD, we need to approve it first
        if (escrow.state === 'HELD') {
            console.log("Escrow is in HELD state, checking if hold period has elapsed...");
            const now = new Date();
            if (now < escrow.holdUntil) {
                console.log("⏳ Hold period not elapsed yet");
                console.log("Hold until:", escrow.holdUntil);
                console.log("Current time:", now);
                console.log("Remaining:", Math.round((escrow.holdUntil - now) / 1000 / 60), "minutes");
                console.log("");
                console.log("💡 You can manually approve it by calling:");
                console.log(`POST /api/payments/escrow/${escrow._id}/release`);
                return;
            }

            console.log("✅ Hold period elapsed, escrow can be released");
            console.log("");
        }

        console.log("✅ Escrow is ready for payout!");
        console.log("");
        console.log("To trigger the payout, call:");
        console.log(`POST /api/payments/escrow/${escrow._id}/release`);
        console.log("Or run the release queue job:");
        console.log(`POST /api/payments/escrow/process-release-queue`);

    } catch (error) {
        console.error("❌ Error testing escrow flow:", error.message);
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

const main = async () => {
    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║     M-Pesa B2C Provider Payout Test Suite             ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    console.log("\n");

    // Test 1: Configuration check
    const { isDevFallback, config } = testB2CConfiguration();

    if (isDevFallback) {
        console.log("✅ Dev fallback mode is active - payouts will work without M-Pesa");
        console.log("To test real B2C integration, set all B2C environment variables");
        console.log("");
    } else if (config) {
        // Test 2: API call
        await testB2CPayoutAPI(config);
    }

    // Test 3: Check escrow data
    await testEscrowFlow();

    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║                    Test Complete                       ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    console.log("\n");
};

main().catch(console.error);
