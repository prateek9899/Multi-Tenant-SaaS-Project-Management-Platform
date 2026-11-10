import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Check, CreditCard, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const BillingPage = () => {
  const { currentOrg, refreshOrganizations } = useAuth();
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, [currentOrg]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [plansRes, invoicesRes] = await Promise.all([
        api.get('/billing/plans'),
        api.get('/billing/invoices'),
      ]);
      setPlans(plansRes.data || []);
      setInvoices(invoicesRes.data || []);
    } catch (err) {
      toast.error('Failed to load billing details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planCode) => {
    if (currentOrg?.plan === planCode) return;
    try {
      setUpgrading(true);
      await api.post('/billing/subscribe', { planCode });
      toast.success(`Successfully switched to ${planCode.toUpperCase()} plan!`);
      await refreshOrganizations();
      loadBillingData();
    } catch (err) {
      toast.error(err.message || 'Subscription upgrade failed');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-8">
      {/* Page Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Subscription & Billing
        </h1>
        <p className="text-sm text-slate-500">
          Stripe test-mode subscription management and plan limits
        </p>
      </div>

      {/* Current Subscription Status Banner */}
      <div className="bg-gradient-to-r from-sky-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-semibold text-sky-400 tracking-wider">
            Current Active Workspace Plan
          </span>
          <h2 className="text-2xl font-bold mt-1 capitalize">
            {currentOrg?.plan || 'Free'} Plan
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Max Seats: {currentOrg?.maxMembers || 5} · Max Projects: {currentOrg?.maxProjects || 3}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-white/10 px-3 py-2 rounded-xl border border-white/10 self-start md:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Stripe Billing Active (Test Environment)</span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((p) => {
            const isCurrent = currentOrg?.plan === p.code;
            return (
              <div
                key={p.code}
                className={`bg-white rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-sky-500 shadow-lg ring-2 ring-sky-500/20 relative'
                    : 'border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                    Active Plan
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-extrabold text-slate-900">
                      ${p.priceMonthly}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">/ month</span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                    {p.features?.map((f, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    disabled={isCurrent || upgrading}
                    onClick={() => handleSubscribe(p.code)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-sky-600 hover:bg-sky-500 text-white'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : 'Select Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-sky-600" />
            <span>Billing & Invoice History</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
              <tr>
                <th className="py-3 px-4">Invoice Reference</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-slate-400">
                    No past invoices on record for this workspace.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {inv.stripeInvoiceId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      ${(inv.amount / 100).toFixed(2)} USD
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;

