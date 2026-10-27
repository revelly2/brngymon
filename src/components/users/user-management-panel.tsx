'use client';

import React, { useState, useEffect } from 'react';
import { SystemUser, UserService, CreateUserInput, INITIAL_SYSTEM_USERS } from '@/lib/services/user-service';
import { useAuth } from '@/lib/context/auth-context';
import { UserRole, BarangayCode, SystemModuleId } from '@/types/database';
import {
  SYSTEM_MODULES,
  CATEGORY_LABELS,
  getDefaultModulesForRole,
  ModuleCategory,
  getModuleDefinition,
} from '@/lib/constants/modules';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Edit3,
  Sliders,
  Sparkles,
  RefreshCw,
  Building,
  KeyRound,
  X,
  Check,
  Power,
  Trash2,
  Database,
  Copy,
  ExternalLink,
  CloudUpload,
} from 'lucide-react';

export function UserManagementPanel() {
  const { user, refreshUserSession } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>(() => INITIAL_SYSTEM_USERS);

  useEffect(() => {
    // Immediate cached display
    setUsers(UserService.getUsers());

    // Live cloud synchronization
    UserService.fetchUsers().then((liveUsers) => {
      setUsers(liveUsers);
    });
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [barangayFilter, setBarangayFilter] = useState<string>('ALL');

  // Modals state
  const [permissionModalUser, setPermissionModalUser] = useState<SystemUser | null>(null);
  const [selectedModules, setSelectedModules] = useState<SystemModuleId[]>([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Cloud sync modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    success: boolean;
    requiresServiceRoleKey?: boolean;
    message: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // New user form state
  const [newUserData, setNewUserData] = useState<CreateUserInput>({
    fullName: '',
    email: '',
    role: 'bhw',
    barangay: 'PALAQUIO',
    employeeId: '',
    contactNumber: '',
    password: '',
    modules: getDefaultModulesForRole('bhw'),
  });

  const handleOpenSyncModal = () => {
    setSyncFeedback(null);
    setCopiedSql(false);
    setIsSyncModalOpen(true);
  };

  const handleRunCloudSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await UserService.syncUsersToSupabase();
      if (res.success) {
        setSyncFeedback({
          success: true,
          message: `Successfully synchronized ${res.syncedCount || users.length} personnel accounts into Supabase Authentication & public.profiles!`,
        });
        reloadUsers();
      } else {
        setSyncFeedback({
          success: false,
          requiresServiceRoleKey: res.requiresServiceRoleKey,
          message: res.error || 'Failed to sync users to cloud database.',
        });
      }
    } catch (err: unknown) {
      setSyncFeedback({
        success: false,
        message: err instanceof Error ? err.message : 'Network error during sync.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySql = () => {
    const sql = UserService.generateSupabaseSyncSQL(users);
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const reloadUsers = () => {
    setUsers(UserService.getUsers());
    refreshUserSession();
  };

  const openPermissionModal = (target: SystemUser) => {
    setPermissionModalUser(target);
    setModalFeedback(null);
    setSelectedModules(target.modules && target.modules.length > 0 ? target.modules : getDefaultModulesForRole(target.role));
  };

  const handleToggleModule = (moduleId: SystemModuleId) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  };

  const handleResetToRoleDefaults = () => {
    if (!permissionModalUser) return;
    setSelectedModules(getDefaultModulesForRole(permissionModalUser.role));
  };

  const handleSavePermissions = async () => {
    if (!permissionModalUser) return;
    setIsSavingPermissions(true);
    setModalFeedback(null);
    try {
      const res = await UserService.updateUserModules(permissionModalUser.id, selectedModules, user);
      if (res.success) {
        setModalFeedback({
          type: 'success',
          text: `Permissions successfully saved! ${selectedModules.length} active modules enabled for ${res.user?.fullName}.`,
        });
        reloadUsers();
        setTimeout(() => {
          setPermissionModalUser(null);
          setModalFeedback(null);
          setFeedbackMessage({
            type: 'success',
            text: `Permissions successfully updated for ${res.user?.fullName}. (${selectedModules.length} active modules)`,
          });
        }, 700);
      } else {
        setModalFeedback({ type: 'error', text: res.error || 'Failed to update user permissions.' });
      }
    } catch (e: unknown) {
      setModalFeedback({
        type: 'error',
        text: e instanceof Error ? e.message : 'An error occurred while saving permissions.',
      });
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleToggleUserStatus = async (targetId: string) => {
    const res = await UserService.toggleUserStatus(targetId, user);
    if (res.success) {
      setFeedbackMessage({
        type: 'success',
        text: `Account operational status updated for ${res.user?.fullName} (${res.user?.status}).`,
      });
      reloadUsers();
    } else {
      setFeedbackMessage({ type: 'error', text: res.error || 'Failed to toggle account status.' });
    }
  };

  const handleDeleteUser = async (targetId: string) => {
    const target = users.find((u) => u.id === targetId);
    if (!target) return;
    if (
      !confirm(
        `Are you sure you want to permanently revoke system access and remove ${target.fullName} (${target.employeeId}) from the operator registry?`
      )
    ) {
      return;
    }

    const res = await UserService.deleteUser(targetId, user);
    if (res.success) {
      setFeedbackMessage({
        type: 'success',
        text: `Successfully purged operator ${target.fullName} from authentication store.`,
      });
      reloadUsers();
    } else {
      setFeedbackMessage({ type: 'error', text: res.error || 'Failed to delete user.' });
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.fullName || !newUserData.email || !newUserData.employeeId || !newUserData.password) {
      setFeedbackMessage({ type: 'error', text: 'Please fill in all mandatory personnel details including initial PIN or password.' });
      return;
    }

    const res = await UserService.createUser(newUserData, user);
    if (res.success) {
      setFeedbackMessage({
        type: 'success',
        text: `Successfully provisioned ${res.user?.fullName} (${res.user?.role.toUpperCase()}) with ${res.user?.modules.length} active modules!`,
      });
      setIsAddUserModalOpen(false);
      setNewUserData({
        fullName: '',
        email: '',
        role: 'bhw',
        barangay: 'PALAQUIO',
        employeeId: '',
        contactNumber: '',
        password: '',
        modules: getDefaultModulesForRole('bhw'),
      });
      reloadUsers();
    } else {
      setFeedbackMessage({ type: 'error', text: res.error || 'Failed to provision user.' });
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.employeeId.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesBarangay = barangayFilter === 'ALL' || u.barangay === barangayFilter;
    return matchesSearch && matchesRole && matchesBarangay;
  });

  const roleBadgeStyles: Record<UserRole, string> = {
    bhw: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    nurse: 'bg-pink-50 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    doctor: 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    admin: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    lgu_viewer: 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Modular RBAC & Personnel Access Control</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            System Users & Modular Permissions Management
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Configure fine-grained system access per healthcare personnel. Enable or disable individual clinical modules—including specialized delegations like granting <strong>Rural Health Midwives or Nurses clearance to the Medical Patient Chart</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleOpenSyncModal}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-semibold text-purple-700 dark:text-purple-300 transition-colors shadow-xs cursor-pointer"
          >
            <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Sync to Database (Auth)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddUserModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision New Health Personnel</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2 font-medium">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by health worker name, email, or Employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Roles</option>
              <option value="bhw">BHW (Intake)</option>
              <option value="nurse">Midwife / Nurse</option>
              <option value="doctor">MHO Doctor</option>
              <option value="admin">System Admin</option>
              <option value="lgu_viewer">LGU Viewer</option>
            </select>

            <select
              value={barangayFilter}
              onChange={(e) => setBarangayFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Stations</option>
              <option value="PALAQUIO">Brgy. Palaquio</option>
              <option value="TABIOG">Brgy. Tabiog</option>
              <option value="BABANGCAG">Brgy. Babangcag</option>
            </select>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              No registered health personnel match the applied search or station filter.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const defaultModules = getDefaultModulesForRole(u.role);
              const activeModules = u.modules || defaultModules;
              const hasSpecialChart =
                u.role !== 'doctor' && u.role !== 'admin' && activeModules.includes('patient_chart');
              const isCurrentUser = UserService.isSameUser(u, user);

              return (
                <div
                  key={u.id}
                  className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/90 transition-all flex flex-col justify-between space-y-3.5 shadow-2xs"
                >
                  {/* Top: Identity & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {u.fullName}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            roleBadgeStyles[u.role]
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                        {u.email}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-1 flex flex-wrap gap-2">
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{u.stationName}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">{u.employeeId}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 border ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>

                  {/* Middle: Enabled Module Pills */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span>Enabled System Modules ({activeModules.length})</span>
                      {hasSpecialChart && (
                        <span className="inline-flex items-center space-x-1 text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/70 px-1.5 py-0.2 rounded font-semibold text-[9px] border border-purple-200 dark:border-purple-800">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Special: Medical Chart</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {activeModules.map((modId) => {
                        const modDef = getModuleDefinition(modId);
                        const isSpecialElevated =
                          (modId === 'patient_chart' && u.role !== 'doctor' && u.role !== 'admin') ||
                          (modId === 'referral_management' && u.role === 'bhw');

                        return (
                          <span
                            key={modId}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                              isSpecialElevated
                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-semibold'
                                : 'bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {modDef?.shortLabel || modId}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom: Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Scope: {u.barangay}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openPermissionModal(u)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Configure Modules</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(u.id)}
                        disabled={isCurrentUser}
                        title={isCurrentUser ? 'Cannot toggle own session' : 'Toggle Active/Inactive status'}
                        className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={isCurrentUser}
                        title={isCurrentUser ? 'Cannot delete own session' : 'Purge user record'}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: GRANULAR MODULAR PERMISSIONS CONFIGURATOR                          */}
      {/* ========================================================================= */}
      {permissionModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>Configure Modules for {permissionModalUser.fullName}</span>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${roleBadgeStyles[permissionModalUser.role]}`}>
                      {permissionModalUser.role}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {permissionModalUser.employeeId} • {permissionModalUser.stationName}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPermissionModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="px-6 py-2.5 bg-purple-50/50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/30 flex items-center justify-between text-xs">
              <span className="text-purple-800 dark:text-purple-300 font-medium">
                Active Modules: <strong>{selectedModules.length}</strong> of {SYSTEM_MODULES.length}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleResetToRoleDefaults}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 transition-colors flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset to {permissionModalUser.role.toUpperCase()} Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedModules(SYSTEM_MODULES.map((m) => m.id))}
                  className="px-2 py-1 text-[11px] text-slate-600 dark:text-slate-300 hover:text-slate-900 font-medium"
                >
                  Enable All
                </button>
              </div>
            </div>

            {/* In-Modal Feedback Alert */}
            {modalFeedback && (
              <div
                className={`mx-6 mt-4 p-3 rounded-xl border text-xs flex items-center justify-between ${
                  modalFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center space-x-2 font-medium">
                  {modalFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>{modalFeedback.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalFeedback(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Modules Categorized Checklist */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(['frontline', 'clinical', 'governance'] as ModuleCategory[]).map((cat) => {
                const catMeta = CATEGORY_LABELS[cat];
                const catModules = SYSTEM_MODULES.filter((m) => m.category === cat);

                return (
                  <div key={cat} className="space-y-2.5">
                    <div className="pb-1 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        {catMeta.label}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {catMeta.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {catModules.map((mod) => {
                        const isChecked = selectedModules.includes(mod.id);
                        const isRoleDefault = mod.defaultRoles.includes(permissionModalUser.role);
                        const isSpecialHighlight =
                          mod.id === 'patient_chart' &&
                          (permissionModalUser.role === 'nurse' || permissionModalUser.role === 'bhw');
                        const Icon = mod.icon;

                        return (
                          <label
                            key={mod.id}
                            className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                              isChecked
                                ? isSpecialHighlight
                                  ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 shadow-2xs'
                                  : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                                : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleModule(mod.id)}
                              className="mt-1 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <Icon
                                  className={`w-4 h-4 shrink-0 ${
                                    isChecked
                                      ? isSpecialHighlight
                                        ? 'text-purple-600 dark:text-purple-400'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-slate-400'
                                  }`}
                                />
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {mod.label}
                                </span>

                                {isSpecialHighlight && isChecked && (
                                  <span className="inline-flex items-center space-x-1 text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>Special Clearance</span>
                                  </span>
                                )}

                                {isRoleDefault ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                                    Role Default
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">
                                    Special Privilege
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-normal">
                                {mod.description}
                              </p>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">
                                Clinical Purpose: {mod.clinicalPurpose}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Changes will take effect immediately upon saving.
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPermissionModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingPermissions}
                  onClick={handleSavePermissions}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isSavingPermissions ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Permissions...</span>
                    </>
                  ) : (
                    <span>Save Modular Permissions</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROVISION NEW HEALTH PERSONNEL                                     */}
      {/* ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Provision New Health Personnel Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-6 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name & Credentials *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos, RN or Dr. Jose Rizal"
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-RHM-008"
                    value={newUserData.employeeId}
                    onChange={(e) => setNewUserData({ ...newUserData, employeeId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. maria.nurse@bucay.gov.ph"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    System Role *
                  </label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setNewUserData({
                        ...newUserData,
                        role: newRole,
                        modules: getDefaultModulesForRole(newRole),
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="bhw">Barangay Health Worker (BHW)</option>
                    <option value="nurse">Public Health Midwife / Nurse</option>
                    <option value="doctor">MHO Municipal Physician</option>
                    <option value="lgu_viewer">LGU Executive Viewer</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Station *
                  </label>
                  <select
                    value={newUserData.barangay}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, barangay: e.target.value as BarangayCode })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PALAQUIO">Barangay Palaquio</option>
                    <option value="TABIOG">Barangay Tabiog</option>
                    <option value="BABANGCAG">Barangay Babangcag</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="0917-xxx-xxxx"
                    value={newUserData.contactNumber}
                    onChange={(e) => setNewUserData({ ...newUserData, contactNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Security PIN / Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Enter station PIN or security password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">
                <span>Account will initially be provisioned with <strong>{getDefaultModulesForRole(newUserData.role).length} default modules</strong> for the {newUserData.role.toUpperCase()} role template. You can customize fine-grained modules at any time.</span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SYNC USERS TO SUPABASE AUTH & DATABASE                             */}
      {/* ========================================================================= */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Synchronize Operators to Supabase Authentication</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-900 dark:text-blue-200 space-y-1.5">
                <div className="flex items-center space-x-2 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>How Supabase Authentication Sync Works</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                  Supabase stores logins in the private <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded font-mono">auth.users</code> table and profiles in <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded font-mono">public.profiles</code>. Standard browser keys cannot directly insert into auth tables. You can sync via the automated server API or run the instant SQL migration script.
                </p>
              </div>

              {syncFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex flex-col gap-1.5 ${
                    syncFeedback.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-semibold">
                    {syncFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    )}
                    <span>{syncFeedback.message}</span>
                  </div>
                  {syncFeedback.requiresServiceRoleKey && (
                    <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                      To enable 1-click automatic API sync, add <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code> from your Supabase Dashboard (Settings → API) into <code className="font-mono">.env.local</code>. In the meantime, use the <strong>Instant SQL Sync</strong> below.
                    </p>
                  )}
                </div>
              )}

              {/* Action 1: Direct Server Sync */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <CloudUpload className="w-4 h-4 text-purple-600" />
                    <span>Method 1: Automatic Server Sync</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Sync all {users.length} registered personnel accounts to Supabase auth & profiles in one click.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunCloudSync}
                  disabled={isSyncing}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold transition-colors cursor-pointer shrink-0 inline-flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>

              {/* Action 2: Instant SQL Sync */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span>Method 2: Instant SQL Sync Script</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Copy the generated idempotent SQL and run it directly in your Supabase SQL Editor.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold transition-colors cursor-pointer shrink-0 inline-flex items-center space-x-1.5"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[10px] font-mono max-h-36 overflow-y-auto leading-relaxed border border-slate-800">
                    {UserService.generateSupabaseSyncSQL(users)}
                  </pre>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>Target Project: <code className="font-mono text-purple-600 dark:text-purple-400">jvvpuzqgwqzqdzmojxlu</code></span>
                  <a
                    href="https://supabase.com/dashboard/project/jvvpuzqgwqzqdzmojxlu/sql/new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-purple-600 dark:text-purple-400 hover:underline font-medium"
                  >
                    <span>Open Supabase SQL Editor</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold transition-colors cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
