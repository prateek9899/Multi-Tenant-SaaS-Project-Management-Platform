const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    priceMonthly: {
      type: Number,
      required: true,
    },
    priceYearly: {
      type: Number,
      required: true,
    },
    maxMembers: {
      type: Number,
      default: 5,
    },
    maxProjects: {
      type: Number,
      default: 3,
    },
    maxStorageMb: {
      type: Number,
      default: 500,
    },
    features: {
      type: [String],
      default: [],
    },
    stripePriceId: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const invoiceSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    stripeInvoiceId: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'paid', 'uncollectible', 'void'],
      default: 'paid',
    },
    periodStart: {
      type: Date,
    },
    periodEnd: {
      type: Date,
    },
    pdfUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Plan = mongoose.model('Plan', planSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = { Plan, Invoice };

