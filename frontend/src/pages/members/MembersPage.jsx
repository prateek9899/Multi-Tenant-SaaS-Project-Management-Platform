import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Users, UserPlus, Shield, Trash2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const MembersPage = () => {
  const { currentOrg } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      loadMembers();
    }
  }, [currentOrg]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organizations/members');
      setMembers(res.data || []);
    } catch (err) {
      toast.error('Failed to load workspace members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/organizations/members/invite', {
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      loadMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to invite member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/organizations/members/${userId}/role`, { role: newRole });
      toast.success('Role updated');
      loadMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member from the workspace?')) return;
    try {
      await api.delete(`/organizations/members/${userId}`);
      toast.success('Member removed');
      loadMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Team Members
          </h1>
          <p className="text-sm text-slate-500">
            RBAC permissions and team seats ({members.length} / {currentOrg?.maxMembers || 5} seats used)
          </p>
        </div>
      </div>

      {/* Invite Member Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
          <UserPlus className="w-4 h-4 text-sky-600" />
          <span>Invite New Team Member</span>
        </h3>
        <form
          onSubmit={handleInvite}
          className="flex flex-col sm:flex-row gap-3 items-center"
        >
          <div className="relative flex-1 w-full">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 text-xs border border-slate-200 rounded-lg"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {submitting ? 'Adding...' : 'Send Invite'}
          </button>
        </form>
      </div>

      {/* Members List Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">
                    Loading members...
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            m.user?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              m.user?.firstName || 'User'
                            )}`
                          }
                          alt=""
                          className="w-7 h-7 rounded-full"
                        />
                        <span className="font-semibold text-slate-800">
                          {m.user?.firstName} {m.user?.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{m.user?.email}</td>
                    <td className="py-3 px-4">
                      {m.role === 'owner' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 capitalize">
                          <Shield className="w-3 h-3" />
                          <span>Owner</span>
                        </span>
                      ) : (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            handleRoleChange(m.user?._id, e.target.value)
                          }
                          className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white capitalize"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {m.role !== 'owner' && (
                        <button
                          onClick={() => handleRemove(m.user?._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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

export default MembersPage;

