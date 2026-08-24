import { Schema, model } from 'mongoose';

const StockMovementSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    type: {
      type: String,
      enum: ['INITIAL', 'STOCK_ADDED', 'TRANSFER', 'SALE', 'RETURN', 'ADJUSTMENT'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true, // Positive for stock gains, negative for reductions
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only log creation time
  }
);

export const StockMovement = model('StockMovement', StockMovementSchema);
