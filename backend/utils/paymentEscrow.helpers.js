export const roundToCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export const computeCommission = ({ grossAmount, commissionType, commissionValue }) => {
    if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
        return { grossAmount: 0, commissionAmount: 0, netAmount: 0 };
    }

    let commissionAmount = 0;
    if (commissionType === "FIXED") {
        commissionAmount = commissionValue;
    } else {
        commissionAmount = (grossAmount * commissionValue) / 100;
    }

    commissionAmount = roundToCurrency(Math.max(0, Math.min(grossAmount, commissionAmount)));
    const netAmount = roundToCurrency(Math.max(0, grossAmount - commissionAmount));

    return {
        grossAmount: roundToCurrency(grossAmount),
        commissionAmount,
        netAmount,
    };
};

export const canRetryPayout = ({
    escrowState,
    failedPayoutsCount,
    lastFailedPayoutAt,
    maxRetries,
    cooldownMinutes,
    now = new Date(),
}) => {
    if (escrowState !== "PAYOUT_FAILED") {
        return { allowed: true, waitSeconds: 0, reason: null };
    }

    if (failedPayoutsCount >= maxRetries) {
        return {
            allowed: false,
            waitSeconds: 0,
            reason: "RETRY_LIMIT_REACHED",
        };
    }

    if (cooldownMinutes > 0 && lastFailedPayoutAt) {
        const elapsedMs = now.getTime() - new Date(lastFailedPayoutAt).getTime();
        const cooldownMs = cooldownMinutes * 60 * 1000;
        if (elapsedMs < cooldownMs) {
            return {
                allowed: false,
                waitSeconds: Math.ceil((cooldownMs - elapsedMs) / 1000),
                reason: "COOLDOWN_ACTIVE",
            };
        }
    }

    return { allowed: true, waitSeconds: 0, reason: null };
};
