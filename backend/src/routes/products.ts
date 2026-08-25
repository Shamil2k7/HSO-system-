import { Router } from 'express';
import { Product } from '../models/Product';
import { authenticateJWT, authorizeRoles, AuthRequest } from '../middleware/auth';
import { StockMovement } from '../models/StockMovement';

const router = Router();

// Protect all product routes
router.use(authenticateJWT);

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    return res.json(products);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/products - Create product (Manager or Admin)
router.post('/', authorizeRoles('MANAGER', 'ADMIN'), async (req: AuthRequest, res) => {
  const { name, category, unit, sellingPrice, minStockLevel, description, imageUrl, status } = req.body;
  if (!name || !category || !unit || sellingPrice === undefined || minStockLevel === undefined) {
    return res.status(400).json({ message: 'All required fields must be supplied' });
  }

  try {

    const product = await Product.create({
      name,
      category,
      unit,
      sellingPrice: Number(sellingPrice),
      minStockLevel: Number(minStockLevel),
      description: description || '',
      imageUrl: imageUrl || '',
      status: status || 'active',
    });

    return res.status(201).json(product);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', authorizeRoles('MANAGER', 'ADMIN'), async (req, res) => {
  const { name, category, unit, sellingPrice, minStockLevel, description, imageUrl, status } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name) product.name = name;
    if (category) product.category = category;
    if (unit) product.unit = unit;
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (minStockLevel !== undefined) product.minStockLevel = Number(minStockLevel);
    if (description !== undefined) product.description = description;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (status) product.status = status;

    await product.save();
    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', authorizeRoles('MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Instead of hard deleting, we check if there are stock items or sales, or do a hard delete
    await Product.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
