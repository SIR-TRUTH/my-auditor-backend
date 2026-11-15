import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// REGISTER BUSINESS AND FIRST BRANCH
router.post("/register", async (req: Request, res: Response) => {
try {
const {
businessName,
industry,
branchName,
} = req.body;

if (!businessName || !String(businessName).trim()) {
  return res.status(400).json({
    message: "Business name is required.",
  });
}

const business = await prisma.$transaction(async (tx) => {
  const newBusiness = await tx.business.create({
    data: {
      name: String(businessName).trim(),
      industry: industry || "Retail",
    },
  });

  const newBranch = await tx.branch.create({
    data: {
      businessId: newBusiness.id,
      name: branchName
        ? String(branchName).trim()
        : "Main Branch",
    },
  });

  return {
    business: newBusiness,
    branch: newBranch,
  };
});

return res.status(201).json({
  success: true,
  message: "Business and branch created successfully.",
  businessId: business.business.id,
  branchId: business.branch.id,
  business: business.business,
  branch: business.branch,
});

} catch (error: any) {
console.error("Business registration error:", error);

return res.status(500).json({
  success: false,
  message: error.message || "Failed to register business.",
});

}
});

// FETCH ALL BRANCHES BELONGING TO A BUSINESS
router.get("/:businessId/branches", async (req: Request, res: Response) => {
try {
const { businessId } = req.params;

const branches = await prisma.branch.findMany({
  where: { businessId },
  orderBy: { createdAt: "asc" },
});

return res.status(200).json(branches);

} catch (error) {
console.error("Branch retrieval error:", error);

return res.status(500).json({
  message: "Failed to retrieve branches.",
});

}
});

// CREATE ADDITIONAL BRANCH
router.post("/:businessId/branches", async (req: Request, res: Response) => {
try {
const { businessId } = req.params;
const { branchName } = req.body;

if (!branchName || !String(branchName).trim()) {
  return res.status(400).json({
    message: "Branch name is required.",
  });
}

const business = await prisma.business.findUnique({
  where: { id: businessId },
});

if (!business) {
  return res.status(404).json({
    message: "Business not found.",
  });
}

const branch = await prisma.branch.create({
  data: {
    businessId,
    name: String(branchName).trim(),
  },
});

return res.status(201).json({
  success: true,
  branch,
});

} catch (error) {
console.error("Branch creation error:", error);

return res.status(500).json({
  message: "Failed to create branch.",
});

}
});

// FETCH BUSINESS DASHBOARD DATA
router.get("/:businessId/dashboard", async (req: Request, res: Response) => {
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
  return res.status(404).json({
    message: "Business profile not found.",
  });
}

const totalAlerts = business.auditFindings.length;

const criticalAlerts = business.auditFindings.filter(
  (finding) => finding.severity === "CRITICAL"
).length;

return res.status(200).json({
  businessName: business.name,
  industry: business.industry,
  executiveSummary:
    "Business onboarded successfully! Process POS sales data or run on-demand inventory audits to inspect store operations.",
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

} catch (error) {
console.error("Dashboard endpoint error:", error);

return res.status(500).json({
  message: "Internal server error.",
});

}
});

export default router;
