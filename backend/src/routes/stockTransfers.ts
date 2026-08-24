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

// GET /api/stock-transfers - Get transfer history (Admin/Manager only)
router.get('/', authorizeRoles('MANAGER', 'ADMIN', 'WAREHOUSEMANAGER'), async (req, res) => {
  try {
    const transfers = await StockTransfer.find({})
      .populate('productId', 'name sku category unit')
      .populate('toSalesmanId', 'name email')
      .populate('managerId', 'name')
      .sort({ createdAt: -1 });

    return res.json(transfers);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/stock-transfers - Transfer stock to a salesman (Manager/Admin only)
router.post('/', authorizeRoles('MANAGER', 'ADMIN', 'WAREHOUSEMANAGER'), async (req: AuthRequest, res) => {
  const { salesmanId, productId, quantity } = req.body;

  if (!salesmanId || !productId || quantity === undefined || quantity <= 0) {
    return res.status(400).json({ message: 'Salesman ID, Product ID, and positive transfer quantity are required.' });
  }

  const qty = Number(quantity);

  try {
    // 1. Verify Salesman existence and role
    const salesman = await User.findById(salesmanId);
    if (!salesman || (salesman.role !== 'SALESMAN' && salesman.role !== 'CASHIER')) {
      return res.status(400).json({ message: 'Invalid Salesman ID.' });
    }

    // Run the operation within our database transaction helper
    const result = await withTransaction(async (session) => {
      // 2. Load and verify product warehouse stock
      const product = await Product.findById(productId).session(session);
      if (!product) {
        throw new Error('Product not found.');
      }

      if (product.mainStock < qty) {
        throw new Error(`Insufficient main stock. Available quantity: ${product.mainStock}`);
      }

      // 3. Deduct stock from Main Inventory
      product.mainStock -= qty;
      await product.save({ session });

      // 4. Add/Update Salesman Personal Stock
      let salesmanStock = await SalesmanStock.findOne({
        salesmanId: salesman._id,
        productId: product._id,
      }).session(session);

      if (salesmanStock) {
        salesmanStock.quantity += qty;
        await salesmanStock.save({ session });
      } else {
        await SalesmanStock.create(
          [
            {
              salesmanId: salesman._id,
              productId: product._id,
              quantity: qty,
            },
          ],
          { session }
        );
      }

      // 5. Generate Sequential Transfer ID
      const count = await StockTransfer.countDocuments({}).session(session);
      const transferId = `ST-${String(count + 1).padStart(4, '0')}`;

      // 6. Record Stock Transfer Log
      const transfer = await StockTransfer.create(
        [
          {
            transferId,
            productId: product._id,
            quantity: qty,
            from: 'Main Warehouse',
            to: salesman.name,
            toSalesmanId: salesman._id,
            managerId: req.user!.id,
            status: 'completed',
          },
        ],
        { session }
      );

      // 7. Record Stock Movement Log (negative for Main Warehouse deduction)
      await StockMovement.create(
        [
          {
            productId: product._id,
            type: 'TRANSFER',
            quantity: -qty,
            from: 'Main Warehouse',
            to: `Salesman: ${salesman.name}`,
            performedBy: req.user!.id,
            notes: `Transfer ${transferId} to Salesman`,
          },
        ],
        { session }
      );

      return {
        transferId,
        productName: product.name,
        qtyTransferred: qty,
        salesmanName: salesman.name,
        remainingMainStock: product.mainStock,
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
