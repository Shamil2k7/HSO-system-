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

    const salesManager = await User.create({
      name: 'Sarah Sales Manager',
      email: 'salesmanager@erp.com',
      password: 'password123',
      role: 'SALESMANAGER',
      status: 'active',
    });

    console.log('Seeded users: Admin, Manager, Salesmen (Rahul, Akhil, Niyas), Sales Manager.');

    // 2. Create Company Products (no mainStock)
    const shirt = await Product.create({
      name: 'ABC Shirt',
      category: 'Shirt',
      unit: 'pcs',
      sellingPrice: 850,
      minStockLevel: 50,
      description: 'Premium quality cotton shirts',
      status: 'active',
    });

    const pant = await Product.create({
      name: 'ABC Pant',
      category: 'Pant',
      unit: 'pcs',
      sellingPrice: 1200,
      minStockLevel: 30,
      description: 'Formal business trousers',
      status: 'active',
    });

    const tshirt = await Product.create({
      name: 'T-Shirt',
      category: 'Shirt',
      unit: 'pcs',
      sellingPrice: 450,
      minStockLevel: 40,
      description: 'Comfortable casual t-shirt',
      status: 'active',
    });

    console.log('Seeded products: ABC Shirt, ABC Pant, T-Shirt.');

    // 3. Create Salesman Stock directly
    // Rahul starts with 50 shirts
    await SalesmanStock.create({ salesmanId: rahul._id, productId: shirt._id, quantity: 50 });
    // Akhil starts with 10 shirts and 30 pants
    await SalesmanStock.create({ salesmanId: akhil._id, productId: shirt._id, quantity: 10 });
    await SalesmanStock.create({ salesmanId: akhil._id, productId: pant._id, quantity: 30 });
    // Niyas starts with 40 T-Shirts
    await SalesmanStock.create({ salesmanId: niyas._id, productId: tshirt._id, quantity: 40 });

    console.log('Seeded initial salesman stocks.');

    // 4. Log supplier stock added movements
    await StockMovement.create([
      {
        productId: shirt._id,
        type: 'STOCK_ADDED',
        quantity: 50,
        from: 'Supplier',
        to: `Salesman: ${rahul.name}`,
        performedBy: manager._id,
        notes: 'Initial seed stock',
      },
      {
        productId: shirt._id,
        type: 'STOCK_ADDED',
        quantity: 10,
        from: 'Supplier',
        to: `Salesman: ${akhil.name}`,
        performedBy: manager._id,
        notes: 'Initial seed stock',
      },
      {
        productId: pant._id,
        type: 'STOCK_ADDED',
        quantity: 30,
        from: 'Supplier',
        to: `Salesman: ${akhil.name}`,
        performedBy: manager._id,
        notes: 'Initial seed stock',
      },
      {
        productId: tshirt._id,
        type: 'STOCK_ADDED',
        quantity: 40,
        from: 'Supplier',
        to: `Salesman: ${niyas.name}`,
        performedBy: manager._id,
        notes: 'Initial seed stock',
      },
    ]);

    // 5. Seed a Salesman-to-Salesman transfer (Rahul transfers 10 shirts to Akhil)
    // Update stock levels to reflect transfer:
    // Rahul shirts: 50 -> 40
    await SalesmanStock.updateOne(
      { salesmanId: rahul._id, productId: shirt._id },
      { $inc: { quantity: -10 } }
    );
    // Akhil shirts: 10 -> 20
    await SalesmanStock.updateOne(
      { salesmanId: akhil._id, productId: shirt._id },
      { $inc: { quantity: 10 } }
    );

    // Create Stock Transfer record
    await StockTransfer.create({
      transferId: 'ST-0001',
      productId: shirt._id,
      quantity: 10,
      from: rahul.name,
      fromSalesmanId: rahul._id,
      to: akhil.name,
      toSalesmanId: akhil._id,
      performedBy: rahul._id,
      status: 'completed',
    });

    // Log Stock Transfer movements
    await StockMovement.create([
      {
        productId: shirt._id,
        type: 'TRANSFER',
        quantity: -10,
        from: `Salesman: ${rahul.name}`,
        to: `Salesman: ${akhil.name}`,
        performedBy: rahul._id,
        notes: 'Transfer ST-0001 (outgoing)',
      },
      {
        productId: shirt._id,
        type: 'TRANSFER',
        quantity: 10,
        from: `Salesman: ${rahul.name}`,
        to: `Salesman: ${akhil.name}`,
        performedBy: rahul._id,
        notes: 'Transfer ST-0001 (incoming)',
      },
    ]);

    console.log('Seeded a salesman-to-salesman transfer.');

    // 6. Seed past sales
    // Rahul sold 5 shirts to 'Global Corp' last week (Completed)
    await Sale.create({
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

    // Update Rahul's stock (40 -> 35)
    await SalesmanStock.updateOne(
      { salesmanId: rahul._id, productId: shirt._id },
      { $inc: { quantity: -5 } }
    );

    await StockMovement.create({
      productId: shirt._id,
      type: 'SALE',
      quantity: -5,
      from: `Salesman: ${rahul.name}`,
      to: 'Customer: Global Corp',
      performedBy: rahul._id,
      notes: 'Invoice INV-0001',
    });

    // Akhil sold 2 Pants + 1 Leather Belt (Extra) to 'Jane Miller' 2 days ago (Pending)
    await Sale.create({
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
      from: `Salesman: ${akhil.name}`,
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
