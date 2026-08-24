import { Schema, model } from 'mongoose';

const StockTransferSchema = new Schema(
  {
    transferId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    from: {
      type: String,
      default: 'Main Warehouse',
    },
    to: {
      type: String,
      required: true,
    },
    toSalesmanId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'cancelled'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

export const StockTransfer = model('StockTransfer', StockTransferSchema);
