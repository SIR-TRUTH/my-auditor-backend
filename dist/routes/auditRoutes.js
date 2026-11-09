"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Resolve or update audit finding status
router.post("/resolve/:findingId", async (req, res) => {
    try {
        const { findingId } = req.params;
        const { status } = req.body; // e.g. "RESOLVED" or "INVESTIGATING"
        const updatedFinding = await prisma.auditFinding.update({
            where: { id: findingId },
            data: {
                severity: status === "RESOLVED" ? "RESOLVED" : "MEDIUM",
                actionable: status === "RESOLVED" ? "Resolved by management." : "Under active investigation.",
            },
        });
        return res.status(200).json({
            message: `Audit finding marked as ${status}`,
            finding: updatedFinding,
        });
    }
    catch (error) {
        console.error("Error resolving finding:", error);
        return res.status(500).json({ message: "Failed to update audit finding status." });
    }
});
exports.default = router;
