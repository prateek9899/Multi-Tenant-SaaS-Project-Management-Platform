import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Trello,
  Flame,
  Users,
  CreditCard,
  ShieldAlert,
  ChevronDown,
  PlusCircle,
  Building2,
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
  const { currentOrg, organizations, selectOrganization } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Kanban Board', href: '/board', icon: Trello },
    { name: 'Sprints', href: '/sprints', icon: Flame },
    { name: 'Team Members', href: '/members', icon: Users },
    { name: 'Billing & Plan', href: '/billing', icon: CreditCard },
    { name: 'Audit Logs', href: '/audit', icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 select-none">
      {/* Brand logo & Tenant Switcher */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-white font-bold text-xl tracking-tight mb-4">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Trello className="w-5 h-5" />
          </div>
          <span>ProjectFlow</span>
          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60 ml-auto">
            SaaS
          </span>
        </div>

        {/* Tenant selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-all"
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <Building2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">
                  {currentOrg ? currentOrg.name : 'Select Workspace'}
                </p>
                <p className="text-[11px] text-slate-400 capitalize truncate">
                  {currentOrg?.plan || 'Free'} Plan
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
              <div className="px-3 py-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Workspaces
              </div>
              {organizations.map((org) => (
                <button
                  key={org._id}
                  onClick={() => {
                    selectOrganization(org);
                    setDropdownOpen(false);
                    navigate('/dashboard');
                  }}
                  className={clsx(
                    'w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/60 transition-colors',
                    currentOrg?._id === org._id
                      ? 'text-sky-400 font-semibold bg-slate-700/40'
                      : 'text-slate-300'
                  )}
                >
                  <span className="truncate">{org.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase">
                    {org.currentUserRole || 'member'}
                  </span>
                </button>
              ))}
              <div className="border-t border-slate-700/60 mt-1 pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/projects');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation menu links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
          Workspace Navigation
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Isolation notice footer */}
      <div className="p-3 m-3 rounded-lg bg-slate-800/50 border border-slate-800 text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300 block mb-0.5">
          🔒 Tenant Isolation Active
        </span>
        Scoped to workspace ID: <code className="text-sky-400">{currentOrg?.slug || 'none'}</code>
      </div>
    </aside>
  );
};

export default Sidebar;

