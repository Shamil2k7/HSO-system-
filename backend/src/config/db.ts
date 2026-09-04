import mongoose, { ClientSession } from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    console.log("🔄 Connecting to MongoDB...");

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB connected successfully");
    console.log("📦 Database:", mongoose.connection.name);
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error(error);

    process.exit(1);
  }
};

/**
 * Executes a callback within a MongoDB session/transaction.
 * If the connected MongoDB instance supports transactions (Replica Set or MongoDB Atlas),
 * it executes atomically with ACID rollback on error.
 * If running on a standalone MongoDB instance (Single topology, common in local development),
 * it executes with the session directly to prevent transaction unsupported errors.
 */
export const withTransaction = async <T>(
  fn: (session: ClientSession) => Promise<T>
): Promise<T> => {
  const session = await mongoose.startSession();
  const topologyType = (mongoose.connection.getClient() as any)?.topology?.description?.type;
  const isStandalone = topologyType === "Single";

  if (isStandalone) {
    try {
      return await fn(session);
    } finally {
      await session.endSession();
    }
  }

  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    // Fallback if standalone was not detected by topology check
    if (
      error?.message?.includes("replica set member or mongos") ||
      error?.message?.includes("Transaction numbers are only allowed")
    ) {
      console.warn("⚠️ Standalone MongoDB detected. Running operation without transaction.");
      return await fn(session);
    }

    throw error;
  } finally {
    await session.endSession();
  }
};