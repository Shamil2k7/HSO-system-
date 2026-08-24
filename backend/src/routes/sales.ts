import { Router } from 'express';
import { Sale } from '../models/Sale';
import { SalesmanStock } from '../models/SalesmanStock';
import { StockMovement } from '../models/StockMovement';
import { User } from '../models/User';
import { authenticateJWT, authorizeRoles, AuthRequest } from '../middleware/auth';
import { withTransaction } from '../config/db';

const router = Router();

// Protect all sales routes
router.use(authenticateJWT);

// GET /api/sales - List sales (Salesman: own sales only, Admin/Manager: all sales)
router.get('/', async (req: AuthRequest, res) => {
  try {
    let query = {};
    if ((req.user!.role === 'SALESMAN' || req.user!.role === 'CASHIER')) {
      query = { salesmanId: req.user!.id };
    }

    const sales = await Sale.find(query)
      .populate('salesmanId', 'name email')
      .sort({ createdAt: -1 });

    return res.json(sales);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/sales/:id - Retrieve specific sale invoice
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('salesmanId', 'name email');
    if (!sale) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    // Salesmen can only access their own invoices
    if ((req.user!.role === 'SALESMAN' || req.user!.role === 'CASHIER') && sale.salesmanId._id.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied: cannot view another salesman\'s invoices.' });
    }

    return res.json(sale);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/sales - Record a new sale (Salesman only)
router.post('/', authorizeRoles('SALESMAN', 'CASHIER'), async (req: AuthRequest, res) => {
  const {
    customerName,
    customerPhone,
    items,
    discount,
    paymentStatus,
    paymentMethod,
    dueDate,
    notes,
  } = req.body;

  if (!customerName) {
    return res.status(400).json({ message: 'Customer Name is required.' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'At least one sale item is required.' });
  }

  try {
    const result = await withTransaction(async (session) => {
      // 1. Calculate pricing totals
      let subtotal = 0;
      const processedItems = [];

      for (const item of items) {
        if (!item.productName || item.quantity === undefined || item.price === undefined || item.quantity <= 0 || item.price < 0) {
          throw new Error('Invalid item fields.');
        }

        const qty = Number(item.quantity);
        const price = Number(item.price);
        const itemTotal = qty * price;
        subtotal += itemTotal;

        processedItems.push({
          productType: item.productType, // 'company' | 'extra'
          productId: item.productType === 'company' ? item.productId : null,
          productName: item.productName,
          quantity: qty,
          price,
          total: itemTotal,
        });

        // 2. Perform Stock Check & Deduction for Company Products
        if (item.productType === 'company') {
          if (!item.productId) {
            throw new Error('Product ID is required for company items.');
          }

          // Fetch personal salesman stock
          const salesStock = await SalesmanStock.findOne({
            salesmanId: req.user!.id,
            productId: item.productId,
          }).session(session);

          if (!salesStock || salesStock.quantity < qty) {
            const currentQty = salesStock ? salesStock.quantity : 0;
            throw new Error(
              `Insufficient stock for product "${item.productName}". Available quantity: ${currentQty}`
            );
          }

          // Deduct from salesman personal stock
          salesStock.quantity -= qty;
          await salesStock.save({ session });

          // Record stock movement log (negative for sale deduction)
          await StockMovement.create(
            [
              {
                productId: item.productId,
                type: 'SALE',
                quantity: -qty,
                from: `Salesman: ${req.user!.name}`,
                to: `Customer: ${customerName}`,
                performedBy: req.user!.id,
                notes: `Sold via invoice`,
              },
            ],
            { session }
          );
        }
      }

      const disc = discount ? Number(discount) : 0;
      const grandTotal = Math.max(0, subtotal - disc);
      const isCompleted = paymentStatus === 'COMPLETED';
      const pendingAmount = isCompleted ? 0 : grandTotal;

      // 3. Generate Sequential Invoice Number
      const count = await Sale.countDocuments({}).session(session);
      const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;

      // 4. Populate payment history if paid immediately
      const paymentHistory = [];
      if (isCompleted) {
        paymentHistory.push({
          amountPaid: grandTotal,
          paymentMethod,
          recordedBy: req.user!.id,
          datePaid: new Date(),
        });
      }

      // 5. Save the Sale invoice
      const sale = await Sale.create(
        [
          {
            invoiceNumber,
            salesmanId: req.user!.id,
            customerName,
            customerPhone: customerPhone || '',
            items: processedItems,
            subtotal,
            discount: disc,
            grandTotal,
            paymentStatus,
            paymentMethod,
            pendingAmount,
            dueDate: isCompleted ? null : dueDate,
            notes: notes || '',
            paymentHistory,
          },
        ],
        { session }
      );

      return sale[0];
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('POS Sale placement error:', error);
    return res.status(400).json({ message: error.message || 'Transaction failed' });
  }
});

// PATCH /api/sales/:id/payment - Mark payment as completed or record collection (Admin/Manager/Salesman)
router.patch('/:id/payment', async (req: AuthRequest, res) => {
  const { paymentMethod, amountPaid } = req.body;
  
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    // Role verification: Salesman can only update their own invoice payments
    if ((req.user!.role === 'SALESMAN' || req.user!.role === 'CASHIER') && sale.salesmanId.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied: cannot update another salesman\'s invoices.' });
    }

    if (sale.paymentStatus === 'COMPLETED') {
      return res.status(400).json({ message: 'Invoice payment is already marked COMPLETED.' });
    }

    const payAmount = amountPaid !== undefined ? Number(amountPaid) : sale.pendingAmount;

    if (payAmount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than zero.' });
    }

    if (payAmount > sale.pendingAmount) {
      return res.status(400).json({ message: `Payment amount exceeds pending balance of ₹${sale.pendingAmount}` });
    }

    // Deduct pending balance and update payment logs
    sale.pendingAmount = Math.max(0, sale.pendingAmount - payAmount);
    
    sale.paymentHistory.push({
      amountPaid: payAmount,
      paymentMethod: paymentMethod || 'CASH',
      datePaid: new Date(),
      recordedBy: req.user!.id as any,
    });

    if (sale.pendingAmount === 0) {
      sale.paymentStatus = 'COMPLETED';
      sale.dueDate = null;
    }

    await sale.save();
    return res.json(sale);
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
