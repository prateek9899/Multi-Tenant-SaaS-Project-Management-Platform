const { Plan, Invoice } = require('../models/Billing');
const Organization = require('../models/Organization');
const { PLAN_LIMITS, AUDIT_ACTIONS } = require('../config/constants');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit } = require('../services/audit.service');

// @desc    Get subscription plans
// @route   GET /api/v1/billing/plans
// @access  Public
const getPlans = asyncHandler(async (req, res) => {
  let plans = await Plan.find({ isActive: true });

  // If plans not yet populated, provide default definitions
  if (plans.length === 0) {
    plans = [
      {
        name: 'Free',
        code: 'free',
        priceMonthly: 0,
        priceYearly: 0,
        maxMembers: 5,
        maxProjects: 3,
        maxStorageMb: 500,
        features: [
          'Up to 5 team members',
          'Up to 3 active projects',
          'Kanban boards & sprints',
          '500MB storage for attachments',
          'Community support',
        ],
      },
      {
        name: 'Starter',
        code: 'starter',
        priceMonthly: 12,
        priceYearly: 120,
        maxMembers: 15,
        maxProjects: 10,
        maxStorageMb: 5000,
        features: [
          'Up to 15 team members',
          'Up to 10 active projects',
          'Kanban & Scrum boards',
          'Custom workflows',
          'Outgoing webhooks',
          '5GB storage',
        ],
      },
      {
        name: 'Professional',
        code: 'professional',
        priceMonthly: 29,
        priceYearly: 290,
        maxMembers: 50,
        maxProjects: 50,
        maxStorageMb: 50000,
        features: [
          'Up to 50 team members',
          'Up to 50 active projects',
          'Advanced audit logging',
          'Unlimited webhooks',
          '50GB storage',
          'Priority email support',
        ],
      },
      {
        name: 'Enterprise',
        code: 'enterprise',
        priceMonthly: 99,
        priceYearly: 990,
        maxMembers: 1000,
        maxProjects: 1000,
        maxStorageMb: 500000,
        features: [
          'Unlimited team members',
          'Unlimited projects',
          'Dedicated SLA',
          'Audit compliance export',
          '500GB storage',
          '24/7 dedicated support',
        ],
      },
    ];
  }

  res.status(200).json({
    success: true,
    data: plans,
  });
});

// @desc    Upgrade / Switch organization subscription plan
// @route   POST /api/v1/billing/subscribe
// @access  Private (Owner/Admin)
const subscribePlan = asyncHandler(async (req, res, next) => {
  const { planCode } = req.body;
  const org = req.organization;

  if (!PLAN_LIMITS[planCode]) {
    return next(new ApiError(400, 'Invalid subscription plan code'));
  }

  const limits = PLAN_LIMITS[planCode];
  org.plan = planCode;
  org.maxMembers = limits.maxMembers;
  org.maxProjects = limits.maxProjects;
  await org.save();

  // Create simulated invoice record for the transaction
  const amount = planCode === 'starter' ? 12 : planCode === 'professional' ? 29 : planCode === 'enterprise' ? 99 : 0;
  if (amount > 0) {
    await Invoice.create({
      organization: org._id,
      stripeInvoiceId: 'inv_mock_' + Date.now(),
      amount: amount * 100, // cents
      currency: 'usd',
      status: 'paid',
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  await logAudit({
    organization: org._id,
    user: req.user,
    action: AUDIT_ACTIONS.BILLING_UPGRADE,
    entityType: 'Organization',
    entityId: org._id,
    entityName: org.name,
    changes: { plan: planCode },
    req,
  });

  res.status(200).json({
    success: true,
    data: org,
    message: `Plan upgraded to ${planCode.toUpperCase()} successfully`,
  });
});

// @desc    Get organization invoices
// @route   GET /api/v1/billing/invoices
// @access  Private (Owner/Admin)
const getInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({
    organization: req.organization._id,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: invoices,
  });
});

// @desc    Stripe webhook handler
// @route   POST /api/v1/billing/webhook
// @access  Public
const handleStripeWebhook = asyncHandler(async (req, res) => {
  const event = req.body;

  // Handles standard Stripe event types
  if (event.type === 'invoice.payment_succeeded') {
    console.log('Stripe webhook received: Payment Succeeded');
  } else if (event.type === 'customer.subscription.deleted') {
    console.log('Stripe webhook received: Subscription Cancelled');
  }

  res.status(200).json({ received: true });
});

module.exports = {
  getPlans,
  subscribePlan,
  getInvoices,
  handleStripeWebhook,
};

