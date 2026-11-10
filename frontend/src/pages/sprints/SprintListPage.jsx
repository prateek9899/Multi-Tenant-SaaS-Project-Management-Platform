import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Flame, Play, CheckCircle, Plus, Calendar, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const SprintListPage = () => {
  const { currentOrg } = useAuth();
  const [sprints, setSprints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    projectId: '',
    name: '',
    goal: '',
  });

  useEffect(() => {
    if (currentOrg) {
      loadData();
    }
  }, [currentOrg]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sprintsRes, projectsRes] = await Promise.all([
        api.get('/sprints'),
        api.get('/projects'),
      ]);
      setSprints(sprintsRes.data || []);
      const pList = projectsRes.data || [];
      setProjects(pList);
      if (pList.length > 0) {
        setForm((prev) => ({ ...prev, projectId: pList[0]._id }));
      }
    } catch (err) {
      toast.error('Failed to load sprints');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (sprintId) => {
    try {
      await api.post(`/sprints/${sprintId}/start`);
      toast.success('Sprint is now active!');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to start sprint');
    }
  };

  const handleComplete = async (sprintId) => {
    try {
      await api.post(`/sprints/${sprintId}/complete`, { moveToBacklog: true });
      toast.success('Sprint completed!');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to complete sprint');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sprints', form);
      toast.success('Sprint created');
      setShowModal(false);
      setForm({ projectId: projects[0]?._id || '', name: '', goal: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create sprint');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sprints
          </h1>
          <p className="text-sm text-slate-500">
            Scrum cycle cadence and sprint milestones
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Sprint</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        </div>
      ) : sprints.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Flame className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No sprints created yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Plan your first sprint cycle to group tickets and track delivery progress.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sprint</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sprints.map((sprint) => (
            <div
              key={sprint._id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-3">
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      sprint.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sprint.status === 'completed'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <Flame className="w-3 h-3" />
                    <span>{sprint.status}</span>
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {sprint.name}
                  </h3>
                </div>

                <p className="text-xs text-slate-500 flex items-center space-x-2">
                  <Target className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>Goal: {sprint.goal || 'No goal specified'}</span>
                </p>

                {/* Progress bar */}
                <div className="pt-2 max-w-md">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>
                      {sprint.completedIssues || 0} of {sprint.totalIssues || 0} issues closed
                    </span>
                    <span className="font-semibold text-slate-700">
                      {sprint.progress || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sky-600 h-2 rounded-full transition-all"
                      style={{ width: `${sprint.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2 self-start md:self-auto">
                {sprint.status === 'planning' && (
                  <button
                    onClick={() => handleStart(sprint._id)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Sprint</span>
                  </button>
                )}

                {sprint.status === 'active' && (
                  <button
                    onClick={() => handleComplete(sprint._id)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Complete Sprint</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for creating a sprint */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Create New Sprint
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Project
                </label>
                <select
                  value={form.projectId}
                  onChange={(e) =>
                    setForm({ ...form, projectId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Sprint Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 2 - Core Services"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Sprint Goal
                </label>
                <textarea
                  rows={2}
                  placeholder="What is the objective of this sprint?"
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-500"
                >
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintListPage;

