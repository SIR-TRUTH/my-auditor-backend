import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Ingest endpoint for external logs/records or audit triggers
router.post("/", async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error("Ingest error:", error);
    return res.status(500).json({ error: "Failed to process ingest record", details: error.message });
  }
});

export default router;