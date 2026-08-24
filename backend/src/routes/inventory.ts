import { Router } from 'express';
import { Product } from '../models/Product';
import { SalesmanStock } from '../models/SalesmanStock';
import { StockMovement } from '../models/StockMovement';
import { authenticateJWT, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

// All inventory routes require authentication
router.use(authenticateJWT);

// GET /api/inventory/main - View warehouse inventory (Admin/Manager only)
router.get('/main', authorizeRoles('MANAGER', 'ADMIN', 'WAREHOUSEMANAGER'), async (req, res) => {
  try {
    const products = await Product.find({}).sort({ name: 1 });
    return res.json(products);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/inventory/add-stock - Add stock to Main Inventory (Manager/Admin only)
router.post('/add-stock', authorizeRoles('MANAGER', 'ADMIN', 'WAREHOUSEMANAGER'), async (req: AuthRequest, res) => {
  const { productId, quantity, notes } = req.body;
  if (!productId || quantity === undefined || quantity <= 0) {
    return res.status(400).json({ message: 'Product ID and a positive quantity are required' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const previousStock = product.mainStock;
    product.mainStock += Number(quantity);
    await product.save();

    // Log stock movement
    await StockMovement.create({
      productId: product._id,
      type: 'STOCK_ADDED',
      quantity: Number(quantity),
      from: 'Supplier',
      to: 'Main Warehouse',
      performedBy: req.user!.id,
      notes: notes || `Stock increased from ${previousStock} to ${product.mainStock}`,
    });

    return res.json({
      message: 'Stock added successfully',
      product,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/inventory/my-stock - View personal assigned stock (Salesman only)
router.get('/my-stock', authorizeRoles('SALESMAN', 'CASHIER'), async (req: AuthRequest, res) => {
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
router.get('/salesman-stock', authorizeRoles('MANAGER', 'ADMIN', 'SALESMANAGER', 'WAREHOUSEMANAGER'), async (req, res) => {
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

export default router;
