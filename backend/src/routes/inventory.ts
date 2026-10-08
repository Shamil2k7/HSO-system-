import { Router } from 'express';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { SalesmanStock } from '../models/SalesmanStock';
import { StockMovement } from '../models/StockMovement';
import { authenticateJWT, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

// All inventory routes require authentication
router.use(authenticateJWT);

// GET /api/inventory/main - View product catalog (Admin/Manager only)
router.get('/main', authorizeRoles('MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const products = await Product.find({}).sort({ name: 1 });
    return res.json(products);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/inventory/add-stock - Add stock directly to a Salesman (Manager/Admin only)
router.post('/add-stock', authorizeRoles('MANAGER', 'ADMIN'), async (req: AuthRequest, res) => {
  const { salesmanId, productId, quantity, notes } = req.body;
  if (!salesmanId || !productId || quantity === undefined || quantity <= 0) {
    return res.status(400).json({ message: 'Salesman ID, Product ID, and positive quantity are required' });
  }

  try {
    const salesman = await User.findById(salesmanId);
    if (!salesman || salesman.role !== 'SALESMAN') {
      return res.status(400).json({ message: 'Invalid Salesman ID.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find or create SalesmanStock
    let salesmanStock = await SalesmanStock.findOne({
      salesmanId: salesman._id,
      productId: product._id,
    });

    const previousStock = salesmanStock ? salesmanStock.quantity : 0;

    if (salesmanStock) {
      salesmanStock.quantity += Number(quantity);
      await salesmanStock.save();
    } else {
      salesmanStock = await SalesmanStock.create({
        salesmanId: salesman._id,
        productId: product._id,
        quantity: Number(quantity),
      });
    }

    // Log stock movement
    await StockMovement.create({
      productId: product._id,
      type: 'STOCK_ADDED',
      quantity: Number(quantity),
      from: 'Supplier',
      to: `Salesman: ${salesman.name}`,
      performedBy: req.user!.id,
      notes: notes || `Direct stock replenishment to ${salesman.name} (from ${previousStock} to ${salesmanStock.quantity})`,
    });

    return res.json({
      message: 'Stock added successfully to Salesman',
      stock: salesmanStock,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/inventory/my-stock - View personal assigned stock (Salesman only)
router.get('/my-stock', authorizeRoles('SALESMAN'), async (req: AuthRequest, res) => {
  try {
    const stock = await SalesmanStock.find({ salesmanId: req.user!.id })
      .populate('productId')
      .sort({ updatedAt: -1 });

    // Format data so UI receives product details and available stock
    const formatted = stock
      .filter((s) => s.productId !== null)
      .map((s: any) => ({
        _id: s._id,
        productId: s.productId._id,
        name: s.productId.name,
        sku: s.productId.sku,
        category: s.productId.category,
        unit: s.productId.unit,
        sellingPrice: s.productId.sellingPrice,
        quantity: s.quantity,
        status: s.productId.status,
      }));

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/inventory/salesman-stock - View all salesman stock (Admin/Manager only)
router.get('/salesman-stock', authorizeRoles('MANAGER', 'ADMIN', 'SALESMANAGER'), async (req, res) => {
  try {
    const stock = await SalesmanStock.find({})
      .populate('salesmanId', 'name email')
      .populate('productId', 'name sku category unit')
      .sort({ updatedAt: -1 });

    return res.json(stock);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/inventory/clear-all-stock - Reset all stock to 0 across all salesmen (Manager/Admin only)
router.post('/clear-all-stock', authorizeRoles('MANAGER', 'ADMIN', 'SALESMANAGER'), async (req: AuthRequest, res) => {
  try {
    // 1. Find all stock records with positive quantity to record movement logs
    const activeStocks = await SalesmanStock.find({ quantity: { $gt: 0 } }).populate('salesmanId', 'name');

    if (activeStocks.length > 0) {
      const movements = activeStocks.map((s: any) => ({
        productId: s.productId,
        type: 'ADJUSTMENT',
        quantity: -s.quantity,
        from: s.salesmanId?.name ? `Salesman: ${s.salesmanId.name}` : 'Salesman Stock',
        to: 'Cleared (Reset to 0)',
        performedBy: req.user!.id,
        notes: `Bulk inventory cleared to 0 by ${req.user!.name || 'manager/admin'}`,
      }));
      await StockMovement.insertMany(movements);
    }

    // 2. Set all stock records quantity to 0
    const result = await SalesmanStock.updateMany({}, { $set: { quantity: 0 } });

    return res.json({
      message: 'All stock has been successfully cleared and reset to 0.',
      clearedRecords: activeStocks.length,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/inventory/clear-stock/:id - Clear specific stock item to 0 (Manager/Admin only)
router.post('/clear-stock/:id', authorizeRoles('MANAGER', 'ADMIN', 'SALESMANAGER'), async (req: AuthRequest, res) => {
  try {
    const stockItem = await SalesmanStock.findById(req.params.id).populate('salesmanId', 'name');
    if (!stockItem) {
      return res.status(404).json({ message: 'Stock record not found' });
    }

    const prevQty = stockItem.quantity;
    if (prevQty > 0) {
      await StockMovement.create({
        productId: stockItem.productId,
        type: 'ADJUSTMENT',
        quantity: -prevQty,
        from: (stockItem.salesmanId as any)?.name ? `Salesman: ${(stockItem.salesmanId as any).name}` : 'Salesman Stock',
        to: 'Cleared (Reset to 0)',
        performedBy: req.user!.id,
        notes: `Individual stock record cleared from ${prevQty} to 0 by ${req.user!.name || 'manager/admin'}`,
      });
      stockItem.quantity = 0;
      await stockItem.save();
    }

    return res.json({
      message: 'Stock record reset to 0 successfully',
      stock: stockItem,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/inventory/clear-my-stock - Salesman clears all their own personal stock to 0
router.post('/clear-my-stock', authorizeRoles('SALESMAN'), async (req: AuthRequest, res) => {
  try {
    const salesmanId = req.user!.id;
    const myStocks = await SalesmanStock.find({ salesmanId, quantity: { $gt: 0 } });

    if (myStocks.length > 0) {
      const movements = myStocks.map((s: any) => ({
        productId: s.productId,
        type: 'ADJUSTMENT',
        quantity: -s.quantity,
        from: `Salesman: ${req.user!.name}`,
        to: 'Cleared (Reset to 0)',
        performedBy: req.user!.id,
        notes: `Personal stock cleared to 0 by ${req.user!.name}`,
      }));
      await StockMovement.insertMany(movements);
      await SalesmanStock.updateMany({ salesmanId }, { $set: { quantity: 0 } });
    }

    return res.json({
      message: 'Your personal stock has been reset to 0.',
      clearedRecords: myStocks.length,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
