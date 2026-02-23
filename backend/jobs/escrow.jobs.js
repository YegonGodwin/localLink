import { processEscrowAutoReleaseApprovals } from "../services/escrow.service.js";
import {
    processEscrowReleaseQueueBatch,
    processEscrowStaleReleasingBatch,
} from "../controllers/payment.controller.js";

const toMs = (seconds, fallback) => {
    const value = Number(seconds);
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return value * 1000;
};

export const startEscrowJobs = () => {
    const enabled = (process.env.ESCROW_JOBS_ENABLED || "false").toLowerCase() === "true";
    if (!enabled) {
        return () => {};
    }

    const autoReleaseIntervalMs = toMs(process.env.ESCROW_AUTO_RELEASE_JOB_INTERVAL_SECONDS, 60 * 1000);
    const releaseQueueIntervalMs = toMs(process.env.ESCROW_RELEASE_QUEUE_JOB_INTERVAL_SECONDS, 90 * 1000);
    const staleReleasingIntervalMs = toMs(
        process.env.ESCROW_STALE_RELEASING_JOB_INTERVAL_SECONDS,
        120 * 1000
    );
    const releaseQueueLimit = Math.min(Number(process.env.ESCROW_RELEASE_QUEUE_JOB_LIMIT) || 20, 100);

    const runAutoRelease = async () => {
        try {
            const outcome = await processEscrowAutoReleaseApprovals();
            if (outcome.approved > 0) {
                console.log(
                    `[escrow-jobs] auto-release: processed=${outcome.processed} approved=${outcome.approved}`
                );
            }
        } catch (error) {
            console.error("[escrow-jobs] auto-release job failed:", error?.message || error);
        }
    };

    const runReleaseQueue = async () => {
        try {
            const outcome = await processEscrowReleaseQueueBatch({ limit: releaseQueueLimit });
            if (outcome.initiated > 0 || outcome.failed.length > 0) {
                console.log(
                    `[escrow-jobs] release-queue: scanned=${outcome.scanned} initiated=${outcome.initiated} failed=${outcome.failed.length}`
                );
            }
        } catch (error) {
            console.error("[escrow-jobs] release-queue job failed:", error?.message || error);
        }
    };

    const runStaleReleasingRecovery = async () => {
        try {
            const outcome = await processEscrowStaleReleasingBatch({ limit: releaseQueueLimit });
            if (outcome.recovered > 0 || outcome.failed.length > 0) {
                console.log(
                    `[escrow-jobs] stale-releasing: scanned=${outcome.scanned} recovered=${outcome.recovered} failed=${outcome.failed.length}`
                );
            }
        } catch (error) {
            console.error("[escrow-jobs] stale-releasing job failed:", error?.message || error);
        }
    };

    runAutoRelease();
    runReleaseQueue();
    runStaleReleasingRecovery();

    const autoReleaseTimer = setInterval(runAutoRelease, autoReleaseIntervalMs);
    const releaseQueueTimer = setInterval(runReleaseQueue, releaseQueueIntervalMs);
    const staleReleasingTimer = setInterval(runStaleReleasingRecovery, staleReleasingIntervalMs);

    console.log(
        `[escrow-jobs] started autoReleaseInterval=${autoReleaseIntervalMs}ms releaseQueueInterval=${releaseQueueIntervalMs}ms staleReleasingInterval=${staleReleasingIntervalMs}ms`
    );

    return () => {
        clearInterval(autoReleaseTimer);
        clearInterval(releaseQueueTimer);
        clearInterval(staleReleasingTimer);
    };
};
