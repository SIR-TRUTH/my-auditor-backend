"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Register a new business profile
router.post("/register", async (req, res) => {
    try {
        const { businessName, industry } = req.body;
        if (!businessName) {
            return res.status(400).json({ message: "Business name is required." });
        }
        const business = await prisma.business.create({
            data: {
                name: businessName,
                industry: industry || "Retail",
            },
        });
        return res.status(201).json({
            message: "Business onboarded successfully",
            business,
        });
    }
    catch (error) {
        console.error("Error creating business:", error);
        return res.status(500).json({ message: error.message || "Failed to create business profile." });
    }
});
// Fetch Business Dashboard Data
router.get("/:businessId/dashboard", async (req, res) => {
    try {
        const { businessId } = req.params;
        const business = await prisma.business.findUnique({
            where: { id: businessId },
            include: {
                products: true,
                auditFindings: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!business) {
            return res.status(404).json({ message: "Business profile not found." });
        }
        const totalAlerts = business.auditFindings.length;
        const criticalAlerts = business.auditFindings.filter((f) => f.severity === "CRITICAL").length;
        return res.status(200).json({
            businessName: business.name,
            industry: business.industry,
            executiveSummary: "Business onboarded successfully! Process POS sales data or run on-demand inventory audits to inspect store operations.",
            summary: {
                totalRevenue: 0,
                totalExpenses: 0,
                netProfit: 0,
                profitMargin: "0.0%",
                status: "Live",
            },
            auditAlerts: {
                totalAlerts,
                criticalAlerts,
                recentFindings: business.auditFindings,
            },
            inventory: {
                totalTrackedProducts: business.products.length,
            },
        });
    }
    catch (error) {
        console.error("Dashboard endpoint error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});
exports.default = router;
