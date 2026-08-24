import mongoose, { ClientSession } from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;

    console.log("Mongo URI loaded:", mongoURI ? "YES" : "NO");

    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined");
    }

    // Debug only — don't print your password
    console.log(
      "Mongo host:",
      mongoURI.split("@")[1]?.split("/")[0] || "Unknown"
    );

    await mongoose.connect(mongoURI);

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

/**
 * Execute operations within a transaction.
 * If Replica Sets are not available (e.g., standard local development),
 * it falls back to executing the operations sequentially without transaction boundaries.
 */
export async function withTransaction<T>(
  operations: (session: ClientSession | null) => Promise<T>
): Promise<T> {
  const connection = mongoose.connection;
  let session: ClientSession | null = null;
  
  try {
    session = await connection.startSession();
    let result: T;
    
    await session.withTransaction(async () => {
      result = await operations(session);
    });
    
    session.endSession();
    return result!;
  } catch (error: any) {
    if (session) {
      try {
        session.endSession();
      } catch (e) {}
    }
    
    const errorMessage = error.message || '';
    const isNoReplicaSetError = 
      errorMessage.includes('Transaction numbers are only allowed on a Replica Set') ||
      errorMessage.includes('replica set') ||
      error.code === 20 ||
      error.codeName === 'TransactionOutsideOfTransaction';
      
    if (isNoReplicaSetError) {
      console.warn('MongoDB is not running as a Replica Set. Running operations in fallback mode.');
      // Execute the operations without a transaction session
      return await operations(null);
    }
    
    // Otherwise, rethrow the transaction error (e.g. ValidationError, InsufficientStock, etc.)
    throw error;
  }
}

