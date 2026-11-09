"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const { businessId, supplierId, reference, items, paymentMethod, totalAmount } = req.body;
            const result = await prisma.$transaction(async (tx) => {
                const purchase = await tx.purchase.create({
                    data: {
                        businessId,
                        supplierId,
                        reference,
                        totalAmount: Number(totalAmount),
                        status: paymentMethod === "CREDIT" ? "PAYABLE" : "PAID",
                    },
                });
                for (const item of items) {
                    await tx.purchaseItem.create({
                        data: {
                            purchaseId: purchase.id,
                            productId: item.productId,
                            quantity: Number(item.quantity),
                            unitCost: Number(item.unitCost),
                            subtotal: Number(item.quantity) * Number(item.unitCost),
                        },
                    });
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { quantity: { increment: Number(item.quantity) } },
                    });
                }
                await tx.journalEntry.create({
                    data: {
                        businessId,
                        reference,
                        debitAccount: "Inventory Asset",
                        creditAccount: paymentMethod === "CREDIT" ? "Accounts Payable" : "Bank / Cash",
                        amount: Number(totalAmount),
                        description: `Purchase reference ${reference || purchase.id}`,
                    },
                });
                return purchase;
            });
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(500).json({ error: "Failed to record purchase" });
        }
    }
    return res.status(405).json({ message: "Method not allowed" });
}
