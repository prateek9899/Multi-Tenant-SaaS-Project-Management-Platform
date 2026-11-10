import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Users,
  Flame,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { currentOrg } = useAuth();
  const [stats, setStats] = useState({
    projectsCount: 0,
    totalIssues: 0,
    doneIssues: 0,
    inProgressIssues: 0,
    activeSprint: null,
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrg) {
      loadDashboardData();
    }
  }, [currentOrg]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsRes, issuesRes, sprintsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/issues'),
        api.get('/sprints'),
      ]);

      const projects = projectsRes.data || [];
      const issues = issuesRes.data || [];
      const sprints = sprintsRes.data || [];

      const done = issues.filter((i) => i.status === 'done').length;
      const inProgress = issues.filter((i) =>
        ['in_progress', 'in_review'].includes(i.status)
      ).length;

      const active = sprints.find((s) => s.status === 'active');

      setStats({
        projectsCount: projects.length,
        totalIssues: issues.length,
        doneIssues: done,
        inProgressIssues: inProgress,
        activeSprint: active,
      });

      setRecentIssues(issues.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  const completionPercent = stats.totalIssues
    ? Math.round((stats.doneIssues / stats.totalIssues) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {currentOrg?.name || 'Workspace Overview'}
          </h1>
          <p className="text-sm text-slate-500">
            Multi-Tenant Isolated Project Workspace · Plan: <span className="capitalize font-semibold text-sky-600">{currentOrg?.plan}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/board"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium shadow-sm transition-all"
          >
            <span>Open Kanban Board</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Projects
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {stats.projectsCount}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Work In Progress
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {stats.inProgressIssues}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Resolved Tickets
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {stats.doneIssues}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completion Rate
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {completionPercent}%
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Middle row: Active Sprint Banner + Progress */}
      {stats.activeSprint && (
        <div className="bg-gradient-to-r from-sky-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold mb-2">
                <Flame className="w-3.5 h-3.5" />
                <span>Active Sprint in Progress</span>
              </div>
              <h2 className="text-xl font-bold">{stats.activeSprint.name}</h2>
              <p className="text-sm text-sky-200 mt-1 max-w-xl">
                Goal: {stats.activeSprint.goal || 'Ship scheduled features and critical bug fixes.'}
              </p>
            </div>
            <Link
              to="/sprints"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all self-start md:self-auto"
            >
              View Sprint Board →
            </Link>
          </div>
        </div>
      )}

      {/* Recent Issues Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-sm">
            Recent Issues Across Projects
          </h3>
          <Link
            to="/board"
            className="text-xs font-medium text-sky-600 hover:text-sky-700"
          >
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60">
              <tr>
                <th className="py-3 px-4">Key</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentIssues.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No issues created yet in this workspace.
                  </td>
                </tr>
              ) : (
                recentIssues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-sky-600">
                      {issue.key}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-md truncate">
                      {issue.title}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-medium text-[11px] capitalize ${
                          issue.status === 'done'
                            ? 'bg-emerald-100 text-emerald-800'
                            : issue.status === 'in_progress'
                            ? 'bg-sky-100 text-sky-800'
                            : issue.status === 'in_review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {issue.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize font-medium text-slate-600">
                      {issue.priority}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {issue.assignee ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={
                              issue.assignee.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                issue.assignee.firstName
                              )}`
                            }
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                          <span>{issue.assignee.firstName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
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

export default DashboardPage;

