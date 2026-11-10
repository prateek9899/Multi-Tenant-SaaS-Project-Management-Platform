import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  X,
  MessageSquare,
  Paperclip,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BoardPage = () => {
  const { currentOrg } = useAuth();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Drag and drop state
  const [draggedIssue, setDraggedIssue] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);

  // New Issue Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState('');
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    issueType: 'task',
    storyPoints: 3,
  });

  // Selected Issue Detail Slideover
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (currentOrg) {
      loadProjects();
    }
  }, [currentOrg]);

  useEffect(() => {
    if (selectedProjectId) {
      loadBoard(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      const list = res.data || [];
      setProjects(list);

      const fromQuery = searchParams.get('projectId');
      if (fromQuery && list.some((p) => p._id === fromQuery)) {
        setSelectedProjectId(fromQuery);
      } else if (list.length > 0) {
        setSelectedProjectId(list[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      toast.error('Failed to load projects');
      setLoading(false);
    }
  };

  const loadBoard = async (projId) => {
    try {
      setLoading(true);
      const boardsRes = await api.get(`/projects/${projId}/boards`);
      const boards = boardsRes.data || [];
      if (boards.length > 0) {
        const boardDetail = await api.get(`/boards/${boards[0]._id}`);
        setBoardData(boardDetail.data);
      } else {
        setBoardData(null);
      }
    } catch (err) {
      toast.error('Failed to load Kanban board');
    } finally {
      setLoading(false);
    }
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, issue) => {
    setDraggedIssue(issue);
    e.dataTransfer.setData('text/plain', issue._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== columnId) {
      setDragOverColId(columnId);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, column) => {
    e.preventDefault();
    setDragOverColId(null);
    if (!draggedIssue || draggedIssue.column === column._id) {
      setDraggedIssue(null);
      return;
    }

    const previousColumns = [...boardData.columns];

    // Optimistic UI update
    setBoardData((prev) => {
      const updated = prev.columns.map((col) => {
        if (col._id === draggedIssue.column) {
          return {
            ...col,
            issues: col.issues.filter((i) => i._id !== draggedIssue._id),
          };
        }
        if (col._id === column._id) {
          return {
            ...col,
            issues: [...col.issues, { ...draggedIssue, column: column._id }],
          };
        }
        return col;
      });
      return { ...prev, columns: updated };
    });

    try {
      await api.post(`/issues/${draggedIssue._id}/move`, {
        targetColumnId: column._id,
        newPosition: column.issues.length,
      });
      toast.success(`Moved ${draggedIssue.key} to ${column.name}`);
    } catch (err) {
      toast.error(err.message || 'Failed to move issue');
      // Rollback on error
      setBoardData((prev) => ({ ...prev, columns: previousColumns }));
    } finally {
      setDraggedIssue(null);
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/issues', {
        projectId: selectedProjectId,
        columnId: targetColumnId,
        boardId: boardData.board._id,
        ...issueForm,
      });

      toast.success(`Issue ${res.data.key} created!`);
      setShowCreateModal(false);
      setIssueForm({
        title: '',
        description: '',
        priority: 'medium',
        issueType: 'task',
        storyPoints: 3,
      });
      loadBoard(selectedProjectId);
    } catch (err) {
      toast.error(err.message || 'Failed to create issue');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedIssue) return;

    try {
      const res = await api.post(`/issues/${selectedIssue._id}/comments`, {
        content: newComment,
      });
      setSelectedIssue((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), res.data],
      }));
      setNewComment('');
      toast.success('Comment posted');
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  const openIssueDetail = async (issueId) => {
    try {
      const res = await api.get(`/issues/${issueId}`);
      setSelectedIssue(res.data);
    } catch (err) {
      toast.error('Failed to load issue details');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Board Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs font-medium text-slate-500">
            {boardData?.columns?.reduce(
              (acc, c) => acc + (c.issues?.length || 0),
              0
            ) || 0}{' '}
            Total Issues
          </span>
        </div>

        <button
          onClick={() => {
            if (boardData?.columns?.length > 0) {
              setTargetColumnId(boardData.columns[0]._id);
              setShowCreateModal(true);
            }
          }}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Issue</span>
        </button>
      </div>

      {/* Kanban Board Horizontal Lanes */}
      {!boardData || !boardData.columns || boardData.columns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 p-8">
          <p className="text-sm text-slate-500">
            No board columns found for this project.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex space-x-4 overflow-x-auto pb-4 items-start select-none">
          {boardData.columns.map((column) => (
            <div
              key={column._id}
              onDragOver={(e) => handleDragOver(e, column._id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column)}
              className={`w-80 flex-shrink-0 bg-slate-100/90 rounded-2xl flex flex-col max-h-[calc(100vh-12rem)] border transition-all ${
                dragOverColId === column._id
                  ? 'border-sky-500 bg-sky-50/50 shadow-md ring-2 ring-sky-500/20'
                  : 'border-slate-200/80 shadow-sm'
              }`}
            >
              {/* Column header */}
              <div className="p-3.5 flex items-center justify-between border-b border-slate-200/60 bg-white/60 rounded-t-2xl">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: column.color || '#3b82f6' }}
                  />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {column.name}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                    {column.issues?.length || 0}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setTargetColumnId(column._id);
                    setShowCreateModal(true);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Column Issue Cards List */}
              <div className="p-3 flex-1 overflow-y-auto space-y-2.5">
                {column.issues?.map((issue) => (
                  <div
                    key={issue._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, issue)}
                    onClick={() => openIssueDetail(issue._id)}
                    className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 cursor-grab active:cursor-grabbing transition-all relative group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[11px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                        {issue.key}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          issue.priority === 'critical'
                            ? 'bg-rose-100 text-rose-700'
                            : issue.priority === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {issue.priority}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-800 leading-snug mb-2 line-clamp-2">
                      {issue.title}
                    </h4>

                    {issue.labels?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {issue.labels.map((l) => (
                          <span
                            key={l}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                          >
                            #{l}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-400 text-xs">
                      <div className="flex items-center space-x-1 font-mono text-[11px]">
                        <span className="w-4 h-4 rounded bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                          {issue.storyPoints || 1}
                        </span>
                      </div>
                      {issue.assignee ? (
                        <img
                          src={
                            issue.assignee.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              issue.assignee.firstName
                            )}`
                          }
                          alt=""
                          title={issue.assignee.firstName}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                          ?
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Create New Issue
            </h2>
            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Issue Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement OAuth authentication"
                  value={issueForm.title}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Details, acceptance criteria, or error logs..."
                  value={issueForm.description}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Type
                  </label>
                  <select
                    value={issueForm.issueType}
                    onChange={(e) =>
                      setIssueForm({ ...issueForm, issueType: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="task">Task</option>
                    <option value="story">Story</option>
                    <option value="bug">Bug</option>
                    <option value="epic">Epic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={issueForm.priority}
                    onChange={(e) =>
                      setIssueForm({ ...issueForm, priority: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Story Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="21"
                    value={issueForm.storyPoints}
                    onChange={(e) =>
                      setIssueForm({
                        ...issueForm,
                        storyPoints: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-500"
                >
                  Create Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Detail Slideover Panel */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                  {selectedIssue.key}
                </span>
                <span className="text-xs font-semibold uppercase text-slate-400">
                  {selectedIssue.issueType}
                </span>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {selectedIssue.title}
                </h2>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedIssue.description || 'No description provided.'}
                </p>
              </div>

              {/* Status & Attributes */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Status</span>
                  <span className="font-semibold capitalize text-slate-800">
                    {selectedIssue.status?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Priority</span>
                  <span className="font-semibold capitalize text-slate-800">
                    {selectedIssue.priority}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Story Points</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {selectedIssue.storyPoints || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Assignee</span>
                  <span className="font-semibold text-slate-800">
                    {selectedIssue.assignee?.firstName || 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Discussion Comments Thread */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>Comments ({selectedIssue.comments?.length || 0})</span>
                </h3>

                <div className="space-y-3 mb-4">
                  {selectedIssue.comments?.map((c) => (
                    <div
                      key={c._id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-slate-800">
                          {c.author?.firstName || 'User'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>

                {/* Add comment form */}
                <form onSubmit={handleAddComment} className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Post
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardPage;

