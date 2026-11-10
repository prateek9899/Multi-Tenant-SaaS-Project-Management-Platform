import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { ShieldAlert, Activity, User } from 'lucide-react';
import toast from 'react-hot-toast';

const AuditLogPage = () => {
  const { currentOrg } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrg) {
      loadLogs();
    }
  }, [currentOrg]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit');
      setLogs(res.data.logs || []);
    } catch (err) {
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Audit Logs
        </h1>
        <p className="text-sm text-slate-500">
          Compliance activity trail and workspace audit records
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold uppercase text-[10px] px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {log.entityType} {log.entityName ? `(${log.entityName})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.user ? (
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {log.user.firstName} {log.user.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">System</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {log.ipAddress || '127.0.0.1'}
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

export default AuditLogPage;

