import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined');
    }

    console.log(`Connecting to MongoDB at: ${mongoURI}`);
    // Use a short serverSelectionTimeoutMS so we fall back quickly if local server is not running
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000,
    });

    console.log('✅ MongoDB connected successfully');
    console.log('📦 Database:', mongoose.connection.name);
  } catch (error) {
    console.warn('⚠️ Local MongoDB connection failed. Attempting to start in-memory MongoDB...');
    try {
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      console.log(`🚀 In-Memory MongoDB Server started at: ${uri}`);
      
      await mongoose.connect(uri);
      console.log('✅ Connected to In-Memory MongoDB successfully');
      
      // Automatically trigger seeding on in-memory db startup so the app is not empty
      console.log('🌱 Seeding database...');
      const { runSeed } = require('../seeds/seed');
      await runSeed();
      console.log('✅ In-Memory DB seeded successfully');
    } catch (fallbackError) {
      console.error('❌ Failed to connect to both local and in-memory MongoDB:', fallbackError);
      process.exit(1);
    }
  }
};
