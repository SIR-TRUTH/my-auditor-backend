import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const businessId = (req.headers['x-business-id'] as string) || 'default-business-id';

  if (req.method === 'POST') {
    try {
      const { branchId, supplierId, items, paymentMethod } = req.body;

      if (!branchId || !items || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Branch and purchase items are required' });
      }

      const reference = `PUR-${Math.floor(100000 + Math.random() * 900000)}`;
      let totalAmount = 0;

      const result = await prisma.$transaction(async (tx) => {
        const purchaseItemsData = items.map((item: any) => {
          const totalCost = item.quantity * item.unitCost;
          totalAmount += totalCost;
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost,
          };
        });

        const purchase = await tx.purchase.create({
          data: {
            businessId,
            branchId,
            supplierId: supplierId || null,
            reference,
            totalAmount,
            status: paymentMethod === 'CREDIT' ? 'PAYABLE' : 'PAID',
            items: { create: purchaseItemsData },
          },
        });

        for (const item of items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) continue;

          const oldQty = product.quantity;
          const oldValuation = oldQty * product.wac;
          const newAdditionVal = item.quantity * item.unitCost;
          const newTotalQty = oldQty + item.quantity;
          const newWac = newTotalQty > 0 ? (oldValuation + newAdditionVal) / newTotalQty : item.unitCost;

          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: newTotalQty,
              costPrice: item.unitCost,
              wac: newWac,
            },
          });

          await tx.inventoryMovement.create({
            data: {
              businessId,
              branchId,
              productId: item.productId,
              type: 'PURCHASE',
              quantity: item.quantity,
              unitCost: item.unitCost,
              referenceId: purchase.id,
              notes: `Purchase batch ${reference}`,
            },
          });
        }

        await tx.journalEntry.create({
          data: {
            businessId,
            reference,
            description: `Inventory purchase via ${paymentMethod}`,
            debitAccount: 'Inventory Asset',
            creditAccount: paymentMethod === 'CREDIT' ? 'Accounts Payable' : 'Bank / Cash',
            amount: totalAmount,
          },
        });

        return purchase;
      });

      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}