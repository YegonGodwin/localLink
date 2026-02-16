const getClientIp = (req) => {
    const forwarded = req.headers?.["x-forwarded-for"];
    if (forwarded && typeof forwarded === "string") {
        return forwarded.split(",")[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || "";
};

const normalizeIp = (ip) => {
    if (!ip) return "";
    if (ip.startsWith("::ffff:")) return ip.slice(7);
    return ip;
};

const parseAllowList = (value) =>
    (value || "")
        .split(",")
        .map((item) => normalizeIp(item.trim()))
        .filter(Boolean);

const getExpectedToken = (kind) => {
    if (kind === "B2C") {
        return process.env.MPESA_B2C_CALLBACK_TOKEN || process.env.MPESA_CALLBACK_TOKEN || "";
    }
    return process.env.MPESA_CALLBACK_TOKEN || "";
};

export const verifyMpesaWebhook = (kind = "STK") => {
    return (req, res, next) => {
        const allowList = parseAllowList(process.env.MPESA_WEBHOOK_IP_ALLOWLIST);
        const ip = normalizeIp(getClientIp(req));

        if (allowList.length > 0 && !allowList.includes(ip)) {
            return res.status(403).json({ message: "Webhook IP not allowed" });
        }

        const expectedToken = getExpectedToken(kind);
        const providedToken = req.headers["x-callback-token"] || req.query?.token || "";

        if (expectedToken && providedToken !== expectedToken) {
            return res.status(401).json({ message: "Invalid webhook token" });
        }

        next();
    };
};

export const __webhookInternals = {
    getClientIp,
    normalizeIp,
    parseAllowList,
};
