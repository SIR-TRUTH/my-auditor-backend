import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Resolve or update audit finding status
router.post("/resolve/:findingId", async (req: any, res: any) => {
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
  } catch (error: any) {
    console.error("Error resolving finding:", error);
    return res.status(500).json({ message: "Failed to update audit finding status." });
  }
});

export default router;