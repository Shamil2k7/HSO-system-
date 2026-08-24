import { Schema, model } from 'mongoose';

const SalesmanStockSchema = new Schema(
  {
    salesmanId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate salesman-product mappings
SalesmanStockSchema.index({ salesmanId: 1, productId: 1 }, { unique: true });

export const SalesmanStock = model('SalesmanStock', SalesmanStockSchema);
