"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const { businessId, items, paymentMethod, totalAmount, reference } = req.body;
            const result = await prisma.$transaction(async (tx) => {
                const sale = await tx.sale.create({
                    data: {
                        businessId,
                        totalAmount: Number(totalAmount),
                    },
                });
                for (const item of items) {
                    const subtotal = Number(item.quantity) * Number(item.unitPrice);
                    await tx.saleItem.create({
                        data: {
                            saleId: sale.id,
                            productId: item.productId,
                            quantity: Number(item.quantity),
                            unitPrice: Number(item.unitPrice),
                            unitCost: Number(item.unitCost || 0),
                            subtotal,
                        },
                    });
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { quantity: { decrement: Number(item.quantity) } },
                    });
                }
                await tx.journalEntry.create({
                    data: {
                        businessId,
                        reference,
                        debitAccount: paymentMethod === "CREDIT" ? "Accounts Receivable" : "Cash / Bank",
                        creditAccount: "Sales Revenue",
                        amount: Number(totalAmount),
                        description: `Sale transaction ${reference || sale.id}`,
                    },
                });
                return sale;
            });
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(500).json({ error: "Failed to record sale" });
        }
    }
    return res.status(405).json({ message: "Method not allowed" });
}
