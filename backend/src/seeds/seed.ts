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

export async function runSeed(): Promise<void> {
  try {
    // Clear existing collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await SalesmanStock.deleteMany({});
    await StockMovement.deleteMany({});
    await StockTransfer.deleteMany({});
    await Sale.deleteMany({});
    console.log('Cleared existing data.');

    // Create Admin User
    await User.create({
      name: 'System Admin',
      mobile: '9999999999',
      password: 'password123',
      plainPassword: 'password123',
      role: 'ADMIN',
      status: 'active',
    });

    console.log('Seeded Admin user successfully.');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}

async function seedStandalone() {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding.');
    await runSeed();
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedStandalone();
}
