"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Ingest endpoint for external logs/records or audit triggers
router.post("/", async (req, res) => {
    try {
        const { businessId, severity, description, title, ruleType, amount, actionable } = req.body;
        if (!businessId) {
            return res.status(400).json({ error: "businessId is required" });
        }
        const finding = await prisma.auditFinding.create({
            data: {
                businessId,
                title: title || "Data Ingest Finding",
                severity: severity || "MEDIUM",
                description: description || "Ingested record flagged for audit verification.",
                ruleType: ruleType || null,
                amount: amount ? Number(amount) : 0,
                actionable: actionable || null,
            },
        });
        return res.status(201).json({
            message: "Record successfully ingested and audit finding created",
            finding,
        });
    }
    catch (error) {
        console.error("Ingest error:", error);
        return res.status(500).json({ error: "Failed to process ingest record", details: error.message });
    }
});
exports.default = router;
