import { Router } from 'express';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { SalesmanStock } from '../models/SalesmanStock';
import { StockTransfer } from '../models/StockTransfer';
import { StockMovement } from '../models/StockMovement';
import { authenticateJWT, authorizeRoles, AuthRequest } from '../middleware/auth';
import { withTransaction } from '../config/db';

const router = Router();

// Protect all stock transfer routes
router.use(authenticateJWT);

// GET /api/stock-transfers - Get transfer history
router.get('/', authorizeRoles('MANAGER', 'ADMIN', 'SALESMAN', 'SALESMANAGER'), async (req: AuthRequest, res) => {
  try {
    const filter = req.user!.role === 'SALESMAN'
      ? { $or: [{ fromSalesmanId: req.user!.id }, { toSalesmanId: req.user!.id }] }
      : {};

    const transfers = await StockTransfer.find(filter)
      .populate('productId', 'name sku category unit')
      .populate('toSalesmanId', 'name email')
      .populate('fromSalesmanId', 'name email')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 });

    return res.json(transfers);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/stock-transfers - Transfer stock to another salesman
router.post('/', authorizeRoles('MANAGER', 'ADMIN', 'SALESMAN', 'SALESMANAGER'), async (req: AuthRequest, res) => {
  let { fromSalesmanId, toSalesmanId, productId, quantity } = req.body;

  // If a salesman is logged in, they can only transfer from themselves
  if (req.user!.role === 'SALESMAN') {
    fromSalesmanId = req.user!.id;
  }

  if (!fromSalesmanId || !toSalesmanId || !productId || quantity === undefined || quantity <= 0) {
    return res.status(400).json({ message: 'Source Salesman, Target Salesman, Product ID, and positive quantity are required.' });
  }

  if (fromSalesmanId === toSalesmanId) {
    return res.status(400).json({ message: 'Source and Target Salesmen must be different.' });
  }

  const qty = Number(quantity);

  try {
    // 1. Verify existence of both users and roles
    const fromSalesman = await User.findById(fromSalesmanId);
    if (!fromSalesman || fromSalesman.role !== 'SALESMAN' || fromSalesman.status !== 'active') {
      return res.status(400).json({ message: 'Invalid or inactive Source Salesman.' });
    }

    const toSalesman = await User.findById(toSalesmanId);
    if (!toSalesman || toSalesman.role !== 'SALESMAN' || toSalesman.status !== 'active') {
      return res.status(400).json({ message: 'Invalid or inactive Target Salesman.' });
    }

    // Run within database transaction
    const result = await withTransaction(async (session) => {
      // 2. Load product
      const product = await Product.findById(productId).session(session);
      if (!product || product.status !== 'active') {
        throw new Error('Product not found or inactive.');
      }

      // 3. Load and verify source stock
      const sourceStock = await SalesmanStock.findOne({
        salesmanId: fromSalesman._id,
        productId: product._id,
      }).session(session);

      if (!sourceStock || sourceStock.quantity < qty) {
        const availableQty = sourceStock ? sourceStock.quantity : 0;
        throw new Error(`Insufficient stock for ${fromSalesman.name}. Available: ${availableQty} ${product.unit}`);
      }

      // 4. Deduct stock from source salesman
      sourceStock.quantity -= qty;
      await sourceStock.save({ session });

      // 5. Add stock to target salesman
      let targetStock = await SalesmanStock.findOne({
        salesmanId: toSalesman._id,
        productId: product._id,
      }).session(session);

      if (targetStock) {
        targetStock.quantity += qty;
        await targetStock.save({ session });
      } else {
        await SalesmanStock.create(
          [
            {
              salesmanId: toSalesman._id,
              productId: product._id,
              quantity: qty,
            },
          ],
          { session }
        );
      }

      // 6. Generate sequential transfer ID
      const count = await StockTransfer.countDocuments({}).session(session);
      const transferId = `ST-${String(count + 1).padStart(4, '0')}`;

      // 7. Record Stock Transfer Log
      await StockTransfer.create(
        [
          {
            transferId,
            productId: product._id,
            quantity: qty,
            from: fromSalesman.name,
            fromSalesmanId: fromSalesman._id,
            to: toSalesman.name,
            toSalesmanId: toSalesman._id,
            performedBy: req.user!.id,
            status: 'completed',
          },
        ],
        { session }
      );

      // 8. Record Stock Movement logs (deduction for sender, addition for receiver)
      await StockMovement.create(
        [
          {
            productId: product._id,
            type: 'TRANSFER',
            quantity: -qty,
            from: `Salesman: ${fromSalesman.name}`,
            to: `Salesman: ${toSalesman.name}`,
            performedBy: req.user!.id,
            notes: `Transfer ${transferId} (outgoing)`,
          },
          {
            productId: product._id,
            type: 'TRANSFER',
            quantity: qty,
            from: `Salesman: ${fromSalesman.name}`,
            to: `Salesman: ${toSalesman.name}`,
            performedBy: req.user!.id,
            notes: `Transfer ${transferId} (incoming)`,
          },
        ],
        { session }
      );

      return {
        transferId,
        productName: product.name,
        qtyTransferred: qty,
        fromSalesmanName: fromSalesman.name,
        toSalesmanName: toSalesman.name,
        remainingSourceStock: sourceStock.quantity,
      };
    });

    return res.status(201).json({
      message: 'Stock transfer completed successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Stock transfer error:', error);
    return res.status(400).json({ message: error.message || 'Transaction failed' });
  }
});

export default router;
