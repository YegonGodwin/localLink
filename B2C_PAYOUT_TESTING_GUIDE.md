# B2C Provider Payout Testing Guide

## Overview

The B2C payout system handles payments to providers after they complete services. The flow involves:

1. Consumer makes payment (STK Push) → Funds held in escrow
2. Provider completes service → Booking marked as COMPLETED
3. Escrow hold period elapses → Auto-approved for release
4. B2C payout initiated → Provider receives funds

## Current Status

✅ **Configuration**: Complete (Dev Fallback Mode enabled)
✅ **STK Push**: Working
✅ **Escrow Creation**: Working
✅ **Test Data**: Available (Escrow ID: `6995f16063e7b4cc153786dd`)

⚠️ **B2C API**: Disabled (using dev fallback)
- Real M-Pesa B2C requires "B2C API" product enabled in Daraja Portal
- Error: "401.002.01: Invalid API call as no apiproduct match found"

## Configuration Changes Made

### 1. Escrow Hold Time (for testing)
```env
ESCROW_AUTO_RELEASE_HOURS=0.1  # 6 minutes instead of 48 hours
```

### 2. Escrow Jobs Enabled
```env
ESCROW_JOBS_ENABLED=true
ESCROW_AUTO_RELEASE_JOB_INTERVAL_SECONDS=30
ESCROW_RELEASE_QUEUE_JOB_INTERVAL_SECONDS=45
```

### 3. B2C Dev Fallback
```env
# B2C credentials commented out to enable dev fallback
# MPESA_B2C_SHORTCODE=...
# MPESA_B2C_INITIATOR_NAME=...
# etc.
```

## Testing the Complete Flow

### Step 1: Create a Booking with Payment

1. Log in as a consumer
2. Browse services and add to cart
3. Complete payment (STK Push will use dev fallback)
4. Booking and escrow are created automatically

### Step 2: Complete the Service

1. Log in as the provider
2. Go to "My Jobs" or bookings
3. Mark the booking as "COMPLETED"
4. This triggers escrow state sync

### Step 3: Wait for Escrow Release

The escrow will go through these states:

```
HELD → RELEASE_APPROVED → RELEASING → RELEASED
```

**Automatic Process** (if escrow jobs are enabled):
- After 6 minutes (0.1 hours), the auto-release job approves the escrow
- The release queue job then initiates the B2C payout
- In dev fallback mode, payout is instantly approved

**Manual Process** (for testing):
```bash
# Approve escrow for release
POST /api/payments/escrow/process-auto-release
Authorization: Bearer <admin_token>

# Trigger payout
POST /api/payments/escrow/<escrowId>/release
Authorization: Bearer <admin_token>
```

### Step 4: Verify Payout

Check the payout status:
```bash
# Get escrow details
GET /api/payments/escrow/<escrowId>
Authorization: Bearer <admin_token>

# Check payout records
# (Query Payout model in database)
```

## Test Scripts

### Check Current Status
```bash
cd backend
node test-escrow-flow.js
```

This shows:
- B2C configuration status
- Escrow states and counts
- Next steps for testing

### Check B2C API (Optional)
```bash
cd backend
node test-b2c-payout.js
```

This tests:
- B2C configuration completeness
- M-Pesa B2C API call (will fail without proper Daraja setup)
- Database escrow status

## API Endpoints

### For Admins

```bash
# Process auto-release approvals
POST /api/payments/escrow/process-auto-release

# Process release queue (trigger payouts)
POST /api/payments/escrow/process-release-queue

# Manually release specific escrow
POST /api/payments/escrow/:escrowId/release

# Get escrow operations summary
GET /api/payments/escrow/ops-summary

# Get reconciliation data
GET /api/payments/escrow/reconciliation
```

### For Providers

```bash
# View earnings
GET /api/users/earnings
```

## Dev Fallback Mode

When B2C credentials are not configured (current state):

✅ **Advantages**:
- Test complete flow without M-Pesa complications
- Instant payout approval
- No callback URL requirements
- Perfect for development

❌ **Limitations**:
- No real money transfer
- No M-Pesa transaction IDs
- Can't test callback handling

## Enabling Real B2C Integration

To use real M-Pesa B2C (for production):

### 1. Enable B2C Product in Daraja Portal

1. Log in to [Daraja Portal](https://developer.safaricom.co.ke/)
2. Go to your app
3. Add "B2C API" product (not just "Lipa Na M-Pesa")
4. Generate security credential using your certificate
5. Register callback URLs:
   - Result URL: `https://your-domain.com/api/payments/mpesa/b2c/result`
   - Timeout URL: `https://your-domain.com/api/payments/mpesa/b2c/timeout`

### 2. Update Environment Variables

Uncomment and update in `backend/.env`:
```env
MPESA_B2C_SHORTCODE=<your_shortcode>
MPESA_B2C_INITIATOR_NAME=<your_initiator>
MPESA_B2C_SECURITY_CREDENTIAL=<your_encrypted_credential>
MPESA_B2C_RESULT_URL=https://your-domain.com/api/payments/mpesa/b2c/result
MPESA_B2C_TIMEOUT_URL=https://your-domain.com/api/payments/mpesa/b2c/timeout
```

### 3. Restart Server

```bash
cd backend
npm start
```

## Troubleshooting

### Issue: "Hold period not elapsed"

**Solution**: Wait for the hold period (6 minutes with current config) or manually approve:
```bash
POST /api/payments/escrow/:escrowId/release
```

### Issue: "Provider has no phone number"

**Solution**: Add phone number to provider user in database:
```javascript
db.users.updateOne(
  { _id: ObjectId("provider_id") },
  { $set: { phone: "254712345678" } }
)
```

### Issue: "Escrow jobs not running"

**Solution**: Check that `ESCROW_JOBS_ENABLED=true` and restart server

### Issue: "B2C API fails with 401.002.01"

**Solution**: This means B2C product is not enabled in your Daraja app. Use dev fallback mode for testing, or enable B2C in Daraja Portal.

## Monitoring

### Check Escrow States
```bash
node test-escrow-flow.js
```

### Check Server Logs
Look for:
```
[escrow-jobs] auto-release: processed=X approved=Y
[escrow-jobs] release-queue: scanned=X initiated=Y failed=Z
```

### Database Queries

```javascript
// Check escrow states
db.escrows.aggregate([
  { $group: { _id: '$state', count: { $sum: 1 } } }
])

// Check recent payouts
db.payouts.find().sort({ createdAt: -1 }).limit(10)

// Check ledger entries
db.ledgerentries.find({ escrow: ObjectId("escrow_id") })
```

## Next Steps

1. ✅ Test STK Push payment flow
2. ✅ Create booking and escrow
3. ✅ Mark booking as completed
4. ⏳ Wait for escrow hold period (6 minutes)
5. ⏳ Verify auto-release approval
6. ⏳ Verify B2C payout (dev fallback)
7. ✅ Check provider earnings

## Production Checklist

Before going live:

- [ ] Enable real B2C API in Daraja Portal
- [ ] Update B2C credentials in `.env`
- [ ] Set `ESCROW_AUTO_RELEASE_HOURS=48` (or desired value)
- [ ] Test with small amounts first
- [ ] Monitor escrow jobs logs
- [ ] Set up alerts for failed payouts
- [ ] Document dispute resolution process
- [ ] Test callback URL accessibility
- [ ] Verify security credential encryption

## Support

- Safaricom Daraja: support@safaricom.co.ke
- Daraja Portal: https://developer.safaricom.co.ke/
- API Docs: https://developer.safaricom.co.ke/Documentation
