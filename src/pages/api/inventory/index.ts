import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: Request, res: Response) {
  if (req.method === "GET") {
    try {
      const businessId = String(req.query.businessId || "");

      if (!businessId) {
        return res.status(400).json({
          error: "Business ID is required",
        });
      }

      const products = await prisma.product.findMany({
        where: { businessId },
        include: {
          movements: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json(products);

    } catch (error) {
      console.error("Inventory fetch error:", error);

      return res.status(500).json({
        error: "Failed to fetch inventory",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const {
        businessId,
        branchId,
        name,
        sku,
        category,
        quantity,
        costPrice,
        sellingPrice,
        minStockLevel,
      } = req.body;

      if (!businessId || !branchId || !name || !sku) {
        return res.status(400).json({
          error: "Business, branch, product name and SKU are required",
        });
      }

      const openingQuantity = Number(quantity ?? 0);
      const unitCost = Number(costPrice ?? 0);
      const salePrice = Number(sellingPrice ?? 0);
      const minimumStock = Number(minStockLevel ?? 5);

      if (
        !Number.isFinite(openingQuantity) ||
        !Number.isFinite(unitCost) ||
        !Number.isFinite(salePrice) ||
        !Number.isFinite(minimumStock) ||
        openingQuantity < 0 ||
        unitCost < 0 ||
        salePrice < 0 ||
        minimumStock < 0
      ) {
        return res.status(400).json({
          error: "Invalid inventory values",
        });
      }

      const branch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          businessId,
        },
      });

      if (!branch) {
        return res.status(400).json({
          error: "Branch does not belong to this business",
        });
      }

      const product = await prisma.$transaction(async (tx) => {
        const createdProduct = await tx.product.create({
          data: {
            businessId,
            name,
            sku,
            category: category || null,
            unitCost,
            sellingPrice: salePrice,
            stockLevel: openingQuantity,
            minStockLevel: minimumStock,
          },
        });

        if (openingQuantity > 0) {
          await tx.inventoryMovement.create({
            data: {
              branchId,
              productId: createdProduct.id,
              type: "OPENING_BALANCE",
              quantity: openingQuantity,
              unitCost,
              reference: "Initial opening stock",
            },
          });
        }

        return createdProduct;
      });

      return res.status(201).json(product);

    } catch (error) {
      console.error("Inventory creation error:", error);

      return res.status(500).json({
        error: "Failed to create product",
      });
    }
  }

  return res.status(405).json({
    error: "Method not allowed",
  });
}
