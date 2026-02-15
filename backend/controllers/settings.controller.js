import Settings from "../models/Settings.model.js";

// @desc    Get platform settings (singleton)
// @route   GET /api/admin/settings
// @access  Private/Admin
export const getSettings = async (req, res) => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({});
    }
    res.json(settings);
};

// @desc    Update platform settings (singleton)
// @route   PUT /api/admin/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
    const {
        platformFee,
        commissionType,
        commissionValue,
        escrowAutoReleaseHours,
        supportEmail,
        maintenanceMode,
        termsUrl,
    } = req.body;

    const update = {};
    if (platformFee !== undefined) update.platformFee = Number(platformFee);
    if (commissionType !== undefined) update.commissionType = commissionType;
    if (commissionValue !== undefined) update.commissionValue = Number(commissionValue);
    if (escrowAutoReleaseHours !== undefined) {
        update.escrowAutoReleaseHours = Number(escrowAutoReleaseHours);
    }
    if (supportEmail !== undefined) update.supportEmail = supportEmail;
    if (maintenanceMode !== undefined) update.maintenanceMode = Boolean(maintenanceMode);
    if (termsUrl !== undefined) update.termsUrl = termsUrl;
    update.updatedBy = req.user._id;

    const settings = await Settings.findOneAndUpdate({}, update, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
    });

    res.json(settings);
};
