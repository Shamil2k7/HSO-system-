import { Schema, model } from 'mongoose';

const SaleItemSchema = new Schema({
  productType: {
    type: String,
    enum: ['company', 'extra'],
    required: true,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    default: null, // Null for extra products
  },
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
});

const PaymentRecordSchema = new Schema({
  amountPaid: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'UPI', 'BANK', 'OTHER'],
    required: true,
  },
  datePaid: {
    type: Date,
    default: Date.now,
  },
  recordedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const SaleSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    salesmanId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    items: [SaleItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['COMPLETED', 'PENDING'],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'BANK', 'OTHER'],
      required: true,
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    saleDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
    paymentHistory: [PaymentRecordSchema],
  },
  {
    timestamps: true,
  }
);

export const Sale = model('Sale', SaleSchema);
