import Escrow from "../models/Escrow.model.js";
import Booking from "../models/Booking.model.js";

const mergeMetadata = (existing, next) => ({
    ...(existing || {}),
    ...(next || {}),
});

export const syncEscrowStateForBookingStatus = async ({ bookingId, bookingStatus, actorId, session = null }) => {
    const escrow = await Escrow.findOne({ booking: bookingId }).session(session || null);
    if (!escrow) return null;

    const now = new Date();
    const actor = actorId ? actorId.toString() : null;

    if (bookingStatus === "CANCELLED") {
        if (["RELEASED", "RELEASING"].includes(escrow.state)) {
            return escrow;
        }

        escrow.state = "CANCELLED";
        escrow.metadata = mergeMetadata(escrow.metadata, {
            cancelledAt: now,
            cancelledBy: actor,
        });
        await escrow.save({ session });
        return escrow;
    }

    if (bookingStatus !== "COMPLETED") {
        return escrow;
    }

    if (escrow.state === "DISPUTED") {
        escrow.metadata = mergeMetadata(escrow.metadata, {
            completionConfirmedAt: now,
            completionConfirmedBy: actor,
            releaseBlockedReason: "DISPUTED",
        });
        await escrow.save({ session });
        return escrow;
    }

    if (escrow.state !== "HELD") {
        return escrow;
    }

    if (now >= escrow.holdUntil) {
        escrow.state = "RELEASE_APPROVED";
        escrow.metadata = mergeMetadata(escrow.metadata, {
            completionConfirmedAt: now,
            completionConfirmedBy: actor,
            releaseApprovedAt: now,
            releaseApprovedReason: "HOLD_WINDOW_ELAPSED",
        });
        await escrow.save({ session });
        return escrow;
    }

    escrow.metadata = mergeMetadata(escrow.metadata, {
        completionConfirmedAt: now,
        completionConfirmedBy: actor,
        pendingAutoReleaseAfter: escrow.holdUntil,
    });
    await escrow.save({ session });
    return escrow;
};

export const processEscrowAutoReleaseApprovals = async () => {
    const now = new Date();
    const candidateEscrows = await Escrow.find({
        state: "HELD",
        holdUntil: { $lte: now },
    }).select("_id booking metadata");

    if (!candidateEscrows.length) {
        return { processed: 0, approved: 0 };
    }

    let approved = 0;
    for (const escrow of candidateEscrows) {
        const booking = await Booking.findById(escrow.booking).select("status");
        if (!booking || booking.status !== "COMPLETED") {
            continue;
        }

        await Escrow.updateOne(
            { _id: escrow._id, state: "HELD" },
            {
                $set: {
                    state: "RELEASE_APPROVED",
                    metadata: mergeMetadata(escrow.metadata, {
                        releaseApprovedAt: now,
                        releaseApprovedReason: "AUTO_TIMEOUT",
                    }),
                },
            }
        );
        approved += 1;
    }

    return { processed: candidateEscrows.length, approved };
};
