import mongoose from 'mongoose';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { SalesmanStock } from '../models/SalesmanStock';
import { StockMovement } from '../models/StockMovement';
import { StockTransfer } from '../models/StockTransfer';
import { Sale } from '../models/Sale';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding.');

    // Clear existing collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await SalesmanStock.deleteMany({});
    await StockMovement.deleteMany({});
    await StockTransfer.deleteMany({});
    await Sale.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create Users
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@erp.com',
      password: 'password123',
      role: 'ADMIN',
      status: 'active',
    });

    const manager = await User.create({
      name: 'John Manager',
      email: 'manager@erp.com',
      password: 'password123',
      role: 'MANAGER',
      status: 'active',
    });

    const rahul = await User.create({
      name: 'Rahul',
      email: 'rahul@erp.com',
      password: 'password123',
      role: 'SALESMAN',
      status: 'active',
    });

    const akhil = await User.create({
      name: 'Akhil',
      email: 'akhil@erp.com',
      password: 'password123',
      role: 'SALESMAN',
      status: 'active',
    });

    const niyas = await User.create({
      name: 'Niyas',
      email: 'niyas@erp.com',
      password: 'password123',
      role: 'SALESMAN',
      status: 'active',
    });

    const cashier = await User.create({
      name: 'Emma Cashier',
      email: 'cashier@erp.com',
      password: 'password123',
      role: 'CASHIER',
      status: 'active',
    });

    const salesManager = await User.create({
      name: 'Sarah Sales Manager',
      email: 'salesmanager@erp.com',
      password: 'password123',
      role: 'SALESMANAGER',
      status: 'active',
    });

    const warehouseManager = await User.create({
      name: 'Bob Warehouse Manager',
      email: 'warehousemanager@erp.com',
      password: 'password123',
      role: 'WAREHOUSEMANAGER',
      status: 'active',
    });

    console.log('Seeded users: Admin, Manager, Salesmen (Rahul, Akhil, Niyas), Cashier, Sales Manager, Warehouse Manager.');

    // 2. Create Company Products
    const shirt = await Product.create({
      name: 'ABC Shirt',
      sku: 'SH-001',
      category: 'Shirt',
      unit: 'pcs',
      sellingPrice: 850,
      minStockLevel: 50,
      description: 'Premium quality cotton shirts',
      status: 'active',
      mainStock: 500,
    });

    const pant = await Product.create({
      name: 'ABC Pant',
      sku: 'PA-001',
      category: 'Pant',
      unit: 'pcs',
      sellingPrice: 1200,
      minStockLevel: 30,
      description: 'Formal business trousers',
      status: 'active',
      mainStock: 300,
    });

    const tshirt = await Product.create({
      name: 'T-Shirt',
      sku: 'TS-001',
      category: 'Shirt',
      unit: 'pcs',
      sellingPrice: 450,
      minStockLevel: 40,
      description: 'Comfortable casual t-shirt',
      status: 'active',
      mainStock: 400,
    });

    console.log('Seeded products: ABC Shirt, ABC Pant, T-Shirt.');

    // 3. Record Initial Stock Movements for Warehouse
    await StockMovement.create([
      {
        productId: shirt._id,
        type: 'INITIAL',
        quantity: 500,
        from: 'Supplier',
        to: 'Main Warehouse',
        performedBy: manager._id,
        notes: 'Initial stock intake',
      },
      {
        productId: pant._id,
        type: 'INITIAL',
        quantity: 300,
        from: 'Supplier',
        to: 'Main Warehouse',
        performedBy: manager._id,
        notes: 'Initial stock intake',
      },
      {
        productId: tshirt._id,
        type: 'INITIAL',
        quantity: 400,
        from: 'Supplier',
        to: 'Main Warehouse',
        performedBy: manager._id,
        notes: 'Initial stock intake',
      },
    ]);
    console.log('Logged initial stock movements.');

    // 4. Seed Stock Transfers (to simulate pre-existing status)
    // Transfer stock to Cashier Emma
    shirt.mainStock -= 100;
    await shirt.save();
    pant.mainStock -= 50;
    await pant.save();
    tshirt.mainStock -= 80;
    await tshirt.save();

    await SalesmanStock.create([
      { salesmanId: cashier._id, productId: shirt._id, quantity: 100 },
      { salesmanId: cashier._id, productId: pant._id, quantity: 50 },
      { salesmanId: cashier._id, productId: tshirt._id, quantity: 80 }
    ]);
    
    await StockMovement.create([
      {
        productId: shirt._id,
        type: 'TRANSFER',
        quantity: -100,
        from: 'Main Warehouse',
        to: 'Cashier: Emma',
        performedBy: manager._id,
        notes: 'Initial seed cashier stock',
      },
      {
        productId: pant._id,
        type: 'TRANSFER',
        quantity: -50,
        from: 'Main Warehouse',
        to: 'Cashier: Emma',
        performedBy: manager._id,
        notes: 'Initial seed cashier stock',
      },
      {
        productId: tshirt._id,
        type: 'TRANSFER',
        quantity: -80,
        from: 'Main Warehouse',
        to: 'Cashier: Emma',
        performedBy: manager._id,
        notes: 'Initial seed cashier stock',
      }
    ]);
    // Transfer 50 ABC Shirts to Rahul
    shirt.mainStock -= 50;
    await shirt.save();

    await SalesmanStock.create({
      salesmanId: rahul._id,
      productId: shirt._id,
      quantity: 50,
    });

    await StockTransfer.create({
      transferId: 'ST-0001',
      productId: shirt._id,
      quantity: 50,
      from: 'Main Warehouse',
      to: 'Rahul',
      toSalesmanId: rahul._id,
      managerId: manager._id,
      status: 'completed',
    });

    await StockMovement.create({
      productId: shirt._id,
      type: 'TRANSFER',
      quantity: -50,
      from: 'Main Warehouse',
      to: 'Salesman: Rahul',
      performedBy: manager._id,
      notes: 'Initial seed transfer',
    });

    // Transfer 30 ABC Pants and 10 Shirts to Akhil
    shirt.mainStock -= 10;
    await shirt.save();
    pant.mainStock -= 30;
    await pant.save();

    await SalesmanStock.create([
      { salesmanId: akhil._id, productId: shirt._id, quantity: 10 },
      { salesmanId: akhil._id, productId: pant._id, quantity: 30 },
    ]);

    await StockTransfer.create([
      {
        transferId: 'ST-0002',
        productId: shirt._id,
        quantity: 10,
        from: 'Main Warehouse',
        to: 'Akhil',
        toSalesmanId: akhil._id,
        managerId: manager._id,
        status: 'completed',
      },
      {
        transferId: 'ST-0003',
        productId: pant._id,
        quantity: 30,
        from: 'Main Warehouse',
        to: 'Akhil',
        toSalesmanId: akhil._id,
        managerId: manager._id,
        status: 'completed',
      },
    ]);

    await StockMovement.create([
      {
        productId: shirt._id,
        type: 'TRANSFER',
        quantity: -10,
        from: 'Main Warehouse',
        to: 'Salesman: Akhil',
        performedBy: manager._id,
        notes: 'Initial seed transfer',
      },
      {
        productId: pant._id,
        type: 'TRANSFER',
        quantity: -30,
        from: 'Main Warehouse',
        to: 'Salesman: Akhil',
        performedBy: manager._id,
        notes: 'Initial seed transfer',
      },
    ]);

    console.log('Seeded stock transfers to Rahul & Akhil.');

    // 5. Seed some past Sales to populate the dashboard analytics
    // Rahul sold 5 shirts to 'Global Corp' last week (Completed)
    const sale1 = await Sale.create({
      invoiceNumber: 'INV-0001',
      salesmanId: rahul._id,
      customerName: 'Global Corp',
      customerPhone: '9112233445',
      items: [
        {
          productType: 'company',
          productId: shirt._id,
          productName: shirt.name,
          quantity: 5,
          price: 850,
          total: 4250,
        },
      ],
      subtotal: 4250,
      grandTotal: 4250,
      paymentStatus: 'COMPLETED',
      paymentMethod: 'BANK',
      pendingAmount: 0,
      saleDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      notes: 'Regular order',
      paymentHistory: [
        {
          amountPaid: 4250,
          paymentMethod: 'BANK',
          recordedBy: rahul._id,
          datePaid: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    // Update Rahul's stock in response to that past sale (quantity goes 50 -> 45)
    await SalesmanStock.updateOne(
      { salesmanId: rahul._id, productId: shirt._id },
      { $inc: { quantity: -5 } }
    );

    await StockMovement.create({
      productId: shirt._id,
      type: 'SALE',
      quantity: -5,
      from: 'Salesman: Rahul',
      to: 'Customer: Global Corp',
      performedBy: rahul._id,
      notes: 'Invoice INV-0001',
    });

    // Akhil sold 2 Pants (Company) + 1 Leather Belt (Extra) to 'Jane Miller' 2 days ago (Pending)
    const sale2 = await Sale.create({
      invoiceNumber: 'INV-0002',
      salesmanId: akhil._id,
      customerName: 'Jane Miller',
      customerPhone: '9888777666',
      items: [
        {
          productType: 'company',
          productId: pant._id,
          productName: pant.name,
          quantity: 2,
          price: 1200,
          total: 2400,
        },
        {
          productType: 'extra',
          productId: null,
          productName: 'Leather Belt',
          quantity: 1,
          price: 800,
          total: 800,
        },
      ],
      subtotal: 3200,
      grandTotal: 3200,
      paymentStatus: 'PENDING',
      paymentMethod: 'CASH',
      pendingAmount: 3200,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // due in 7 days
      saleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      notes: 'Will pay next week',
      paymentHistory: [],
    });

    // Update Akhil's stock (pant goes 30 -> 28)
    await SalesmanStock.updateOne(
      { salesmanId: akhil._id, productId: pant._id },
      { $inc: { quantity: -2 } }
    );

    await StockMovement.create({
      productId: pant._id,
      type: 'SALE',
      quantity: -2,
      from: 'Salesman: Akhil',
      to: 'Customer: Jane Miller',
      performedBy: akhil._id,
      notes: 'Invoice INV-0002',
    });

    console.log('Seeded past sales with stock deductions.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
