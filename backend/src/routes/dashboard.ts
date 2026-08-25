import { Router } from 'express';
import mongoose from 'mongoose';
import { Sale } from '../models/Sale';
import { Product } from '../models/Product';
import { SalesmanStock } from '../models/SalesmanStock';
import { User } from '../models/User';
import { authenticateJWT, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

// Protect dashboard endpoints
router.use(authenticateJWT);

// GET /api/dashboard/salesman - Salesman Specific Stats
router.get('/salesman', authorizeRoles('SALESMAN'), async (req: AuthRequest, res) => {
  try {
    const salesmanId = req.user!.id;
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Monday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Sales Aggregations (Today, Week, Month)
    const salesData = await Sale.find({ salesmanId });
    
    let todaySales = 0;
    let weekSales = 0;
    let monthSales = 0;
    let pendingAmount = 0;
    let completedAmount = 0;

    const todayMs = startOfToday.getTime();
    const weekMs = startOfWeek.getTime();
    const monthMs = startOfMonth.getTime();

    salesData.forEach((sale) => {
      const saleTime = new Date(sale.saleDate).getTime();
      if (saleTime >= todayMs) {
        todaySales += sale.grandTotal;
      }
      if (saleTime >= weekMs) {
        weekSales += sale.grandTotal;
      }
      if (saleTime >= monthMs) {
        monthSales += sale.grandTotal;
      }
      
      pendingAmount += sale.pendingAmount;
      if (sale.paymentStatus === 'COMPLETED') {
        completedAmount += sale.grandTotal;
      } else {
        completedAmount += (sale.grandTotal - sale.pendingAmount);
      }
    });

    // 2. Personal Stock Summary
    const stockItems = await SalesmanStock.find({ salesmanId }).populate('productId');
    const totalStockQty = stockItems.reduce((acc, item) => acc + item.quantity, 0);

    // 3. Recent Sales (last 5)
    const recentSales = await Sale.find({ salesmanId })
      .sort({ saleDate: -1 })
      .limit(5);

    // 4. Personal Pending Payment List
    const pendingPayments = await Sale.find({ 
      salesmanId, 
      paymentStatus: 'PENDING' 
    })
      .sort({ dueDate: 1 })
      .limit(5);

    // 5. Sales graph (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

      const dayTotal = salesData
        .filter((s) => {
          const t = new Date(s.saleDate).getTime();
          return t >= dayStart && t <= dayEnd;
        })
        .reduce((sum, s) => sum + s.grandTotal, 0);

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      chartData.push({ day: dayName, sales: dayTotal });
    }

    return res.json({
      metrics: {
        todaySales,
        weekSales,
        monthSales,
        totalStockQty,
        pendingAmount,
        completedAmount,
      },
      recentSales,
      pendingPayments,
      chartData,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/dashboard/manager - Manager and Admin Stats
router.get('/manager', authorizeRoles('MANAGER', 'ADMIN', 'SALESMANAGER'), async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of current week (Monday)
    const tempDate = new Date();
    const dayOfWeek = tempDate.getDay();
    const diff = tempDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(tempDate.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayMs = startOfToday.getTime();
    const weekMs = startOfWeek.getTime();
    const monthMs = startOfMonth.getTime();

    // 1. Fetch Sales and calculate metrics
    const allSales = await Sale.find({}).populate('salesmanId', 'name');
    
    let todaySales = 0;
    let weekSales = 0;
    let monthSales = 0;
    let pendingPayments = 0;
    let completedPayments = 0;

    allSales.forEach((sale) => {
      const saleTime = new Date(sale.saleDate).getTime();
      if (saleTime >= todayMs) todaySales += sale.grandTotal;
      if (saleTime >= weekMs) weekSales += sale.grandTotal;
      if (saleTime >= monthMs) monthSales += sale.grandTotal;

      pendingPayments += sale.pendingAmount;
      if (sale.paymentStatus === 'COMPLETED') {
        completedPayments += sale.grandTotal;
      } else {
        completedPayments += (sale.grandTotal - sale.pendingAmount);
      }
    });

    // 2. Aggregate stock details across all salesmen
    const products = await Product.find({});
    const salesmanStock = await SalesmanStock.find({});
    
    // Create product stock lookup map
    const productStocksMap = new Map<string, number>();
    salesmanStock.forEach((ss) => {
      if (ss.productId) {
        const prodId = ss.productId.toString();
        productStocksMap.set(prodId, (productStocksMap.get(prodId) || 0) + ss.quantity);
      }
    });

    let mainStockTotal = 0;
    let lowStockCount = 0;
    const lowStockAlertList: any[] = [];

    products.forEach((product) => {
      const totalStock = productStocksMap.get(product._id.toString()) || 0;
      mainStockTotal += totalStock;
      
      const isLow = product.status === 'active' && totalStock <= product.minStockLevel;
      if (isLow) {
        lowStockCount++;
        lowStockAlertList.push({
          _id: product._id,
          name: product.name,
          sku: product.sku,
          mainStock: totalStock, // mapped to mainStock so frontend continues to display it
          minStockLevel: product.minStockLevel,
          unit: product.unit,
        });
      }
    });

    // 3. Weekly Sales Graph (Mon - Sun of current week)
    const weeklyChartData = [];
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
      const targetDay = new Date(startOfWeek);
      targetDay.setDate(startOfWeek.getDate() + i);
      
      const dayStart = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 0, 0, 0, 0).getTime();
      const dayEnd = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 23, 59, 59, 999).getTime();

      const salesSum = allSales
        .filter((s) => {
          const t = new Date(s.saleDate).getTime();
          return t >= dayStart && t <= dayEnd;
        })
        .reduce((acc, s) => acc + s.grandTotal, 0);

      weeklyChartData.push({ day: daysOfWeek[i], sales: salesSum });
    }

    // 4. Monthly Sales Graph (divided by weeks)
    const monthlyChartData = [];
    for (let w = 1; w <= 4; w++) {
      const wStart = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), (w - 1) * 7 + 1, 0, 0, 0, 0).getTime();
      const wEnd = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), w * 7, 23, 59, 59, 999).getTime();

      const wSales = allSales
        .filter((s) => {
          const t = new Date(s.saleDate).getTime();
          return t >= wStart && t <= wEnd;
        })
        .reduce((acc, s) => acc + s.grandTotal, 0);

      monthlyChartData.push({ week: `Week ${w}`, sales: wSales });
    }

    // 5. Salesman Performance Table
    const salesmen = await User.find({ role: 'SALESMAN', status: 'active' });
    const performanceTable = [];

    for (const salesman of salesmen) {
      let sToday = 0;
      let sWeek = 0;
      let sMonth = 0;
      let sPending = 0;

      allSales.forEach((sale) => {
        if (sale.salesmanId && sale.salesmanId._id.toString() === salesman._id.toString()) {
          const saleTime = new Date(sale.saleDate).getTime();
          if (saleTime >= todayMs) sToday += sale.grandTotal;
          if (saleTime >= weekMs) sWeek += sale.grandTotal;
          if (saleTime >= monthMs) sMonth += sale.grandTotal;
          sPending += sale.pendingAmount;
        }
      });

      performanceTable.push({
        id: salesman._id,
        name: salesman.name,
        today: sToday,
        week: sWeek,
        month: sMonth,
        pending: sPending,
      });
    }

    // 6. Recent Sales list (last 8)
    const recentSales = await Sale.find({})
      .populate('salesmanId', 'name')
      .sort({ saleDate: -1 })
      .limit(8);

    // 7. Low Stock alerts (top 5)
    const lowStockAlerts = lowStockAlertList.slice(0, 5);

    return res.json({
      metrics: {
        todaySales,
        weekSales,
        monthSales,
        mainStockTotal,
        lowStockCount,
        pendingPayments,
        completedPayments,
      },
      weeklyChartData,
      monthlyChartData,
      performanceTable,
      recentSales,
      lowStockAlerts,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
