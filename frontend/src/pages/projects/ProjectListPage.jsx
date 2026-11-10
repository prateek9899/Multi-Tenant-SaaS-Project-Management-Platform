import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  FolderKanban,
  Plus,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProjectListPage = () => {
  const { currentOrg } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    projectType: 'kanban',
  });

  useEffect(() => {
    if (currentOrg) {
      loadProjects();
    }
  }, [currentOrg]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      setProjects(res.data || []);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', formData);
      toast.success('Project created with default Kanban board');
      setShowModal(false);
      setFormData({ name: '', key: '', description: '', projectType: 'kanban' });
      loadProjects();
    } catch (err) {
      toast.error(err.message || 'Failed to create project');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Action */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-slate-500">
            Manage projects and boards scoped to {currentOrg?.name}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <FolderKanban className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            No projects found in this workspace
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Create your first project to configure a Kanban board and start tracking sprints and issues.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                    {project.key}
                  </span>
                  <span className="text-[11px] font-semibold uppercase text-slate-400 px-2 py-0.5 rounded bg-slate-50 border border-slate-200/60">
                    {project.projectType}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img
                    src={
                      project.lead?.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        project.lead?.firstName || 'Lead'
                      )}`
                    }
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    {project.lead?.firstName || 'Unassigned'}
                  </span>
                </div>
                <Link
                  to={`/board?projectId=${project._id}`}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  <span>Open Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Create New Project
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Platform"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoKey = name
                      .replace(/[^a-zA-Z]/g, '')
                      .slice(0, 3)
                      .toUpperCase();
                    setFormData({
                      ...formData,
                      name,
                      key: formData.key ? formData.key : autoKey,
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Key Prefix (2-5 uppercase chars)
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="e.g. PRJ"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      key: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full font-mono uppercase px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the project goals"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
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
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectListPage;

