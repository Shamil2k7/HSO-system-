import { Router } from 'express';
import { Sale } from '../models/Sale';
import { Product } from '../models/Product';
import { SalesmanStock } from '../models/SalesmanStock';
import { StockMovement } from '../models/StockMovement';
import { StockTransfer } from '../models/StockTransfer';
import { User } from '../models/User';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = Router();

// Protect reports endpoints
router.use(authenticateJWT);
router.use(authorizeRoles('MANAGER', 'ADMIN', 'SALESMANAGER'));

// GET /api/reports/sales - Advanced Sales Report
router.get('/sales', async (req, res) => {
  const { startDate, endDate, salesmanId, productId, customerName } = req.query;

  try {
    const filter: any = {};

    // Date filtering
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) {
        filter.saleDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        // Set to end of the day
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filter.saleDate.$lte = end;
      }
    }

    if (salesmanId) {
      filter.salesmanId = salesmanId;
    }

    if (customerName) {
      filter.customerName = { $regex: customerName as string, $options: 'i' };
    }

    if (productId) {
      filter['items.productId'] = productId;
    }

    const sales = await Sale.find(filter)
      .populate('salesmanId', 'name email')
      .sort({ saleDate: -1 });

    // Calculate aggregations
    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalSalesCount = sales.length;
    let totalItemsSold = 0;
    
    // Track company product sales vs extra product sales
    const companyProductSalesMap: { [key: string]: { name: string; qty: number; revenue: number } } = {};
    const extraProductSalesMap: { [key: string]: { name: string; qty: number; revenue: number } } = {};

    sales.forEach((sale) => {
      totalRevenue += sale.grandTotal;
      totalDiscount += sale.discount;

      sale.items.forEach((item) => {
        // If product ID filtering is set, skip counting other items in the map
        if (productId && item.productId?.toString() !== productId) return;

        totalItemsSold += item.quantity;
        
        if (item.productType === 'company') {
          const key = item.productId ? item.productId.toString() : item.productName;
          if (!companyProductSalesMap[key]) {
            companyProductSalesMap[key] = { name: item.productName, qty: 0, revenue: 0 };
          }
          companyProductSalesMap[key].qty += item.quantity;
          companyProductSalesMap[key].revenue += item.total;
        } else {
          const key = item.productName;
          if (!extraProductSalesMap[key]) {
            extraProductSalesMap[key] = { name: item.productName, qty: 0, revenue: 0 };
          }
          extraProductSalesMap[key].qty += item.quantity;
          extraProductSalesMap[key].revenue += item.total;
        }
      });
    });

    return res.json({
      summary: {
        totalRevenue,
        totalDiscount,
        totalSalesCount,
        totalItemsSold,
      },
      sales,
      companySales: Object.values(companyProductSalesMap),
      extraSales: Object.values(extraProductSalesMap),
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/reports/payments - Collections & Aging Pending Payments Report
router.get('/payments', async (req, res) => {
  const { paymentStatus, salesmanId, dueBefore } = req.query;

  try {
    const filter: any = {};

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (salesmanId) {
      filter.salesmanId = salesmanId;
    }

    if (dueBefore) {
      filter.dueDate = { $lte: new Date(dueBefore as string) };
    }

    const sales = await Sale.find(filter)
      .populate('salesmanId', 'name email')
      .sort({ dueDate: 1 });

    const totalPendingAmount = sales.reduce((sum, s) => sum + s.pendingAmount, 0);
    const totalSalesValue = sales.reduce((sum, s) => sum + s.grandTotal, 0);

    return res.json({
      summary: {
        totalPendingAmount,
        totalSalesValue,
        pendingCount: sales.filter((s) => s.paymentStatus === 'PENDING').length,
        completedCount: sales.filter((s) => s.paymentStatus === 'COMPLETED').length,
      },
      sales,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/reports/stock - Complete Inventory and Movement Ledger Report
router.get('/stock', async (req, res) => {
  try {
    // 1. Fetch products
    const products = await Product.find({}).sort({ name: 1 });

    // 2. Salesman assigned stock
    const salesmanStock = await SalesmanStock.find({})
      .populate('salesmanId', 'name email')
      .populate('productId', 'name sku category unit')
      .sort({ salesmanId: 1 });

    // 3. Recent movements
    const movements = await StockMovement.find({})
      .populate('productId', 'name sku')
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(50);

    // 4. Stock Transfer history
    const transfers = await StockTransfer.find({})
      .populate('productId', 'name sku')
      .populate('toSalesmanId', 'name')
      .populate('fromSalesmanId', 'name')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate product stock map across all salesmen
    const productStocksMap = new Map<string, number>();
    salesmanStock.forEach((ss) => {
      if (ss.productId) {
        const prodId = ss.productId._id.toString();
        productStocksMap.set(prodId, (productStocksMap.get(prodId) || 0) + ss.quantity);
      }
    });

    // Construct virtual warehouseStock
    const warehouseStock = products.map((p) => {
      const totalStock = productStocksMap.get(p._id.toString()) || 0;
      return {
        ...p.toObject(),
        mainStock: totalStock, // mapped to mainStock so frontend reports don't break
      };
    });

    // Calculate stock metrics
    const lowStockItems = warehouseStock.filter((p) => p.status === 'active' && p.mainStock <= p.minStockLevel);
    const outOfStockItems = warehouseStock.filter((p) => p.mainStock === 0);

    return res.json({
      warehouseStock,
      salesmanStock,
      movements,
      transfers,
      metrics: {
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        totalProductsCatalog: products.length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/reports/salesman/:id - Click-through detail of Salesman performance
router.get('/salesman/:id', async (req, res) => {
  try {
    const salesmanId = req.params.id;
    const salesman = await User.findById(salesmanId).select('-password');
    if (!salesman || salesman.role !== 'SALESMAN') {
      return res.status(404).json({ message: 'Salesman not found.' });
    }

    const sales = await Sale.find({ salesmanId }).sort({ saleDate: -1 });
    const stock = await SalesmanStock.find({ salesmanId }).populate('productId');

    let totalRevenue = 0;
    let pendingPayments = 0;
    
    // Sum company product sales quantities
    const productSalesMap: { [key: string]: number } = {};
    const extraProductsList: { name: string; qty: number; revenue: number }[] = [];

    sales.forEach((sale) => {
      totalRevenue += sale.grandTotal;
      pendingPayments += sale.pendingAmount;

      sale.items.forEach((item) => {
        if (item.productType === 'company') {
          const prodId = item.productId ? item.productId.toString() : 'unknown';
          productSalesMap[prodId] = (productSalesMap[prodId] || 0) + item.quantity;
        } else {
          extraProductsList.push({
            name: item.productName,
            qty: item.quantity,
            revenue: item.total,
          });
        }
      });
    });

    const companySalesList = [];
    for (const prodId of Object.keys(productSalesMap)) {
      const prod = await Product.findById(prodId);
      if (prod) {
        companySalesList.push({
          productId: prod._id,
          name: prod.name,
          sku: prod.sku,
          sellingPrice: prod.sellingPrice,
          unitsSold: productSalesMap[prodId],
          totalSalesValue: productSalesMap[prodId] * prod.sellingPrice,
        });
      }
    }

    return res.json({
      salesman,
      summary: {
        totalRevenue,
        pendingPayments,
        salesCount: sales.length,
      },
      sales,
      stock,
      companySalesList,
      extraSalesList: extraProductsList,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
