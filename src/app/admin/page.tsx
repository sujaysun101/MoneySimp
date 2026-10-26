"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  Search,
  Plus,
  RefreshCw,
  Check,
  X,
  Trash2,
  Lock,
  Sparkles,
  Sliders,
  AlertCircle,
  FileSpreadsheet,
  MessageSquare,
  Bot,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { PublicUser, UserPermissions } from '@/lib/auth/user-store';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Privileges Modal State
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editPermissions, setEditPermissions] = useState<UserPermissions>({
    canAccessAI: true,
    canManageBudgets: true,
    canExportReports: false,
    canManageCommunity: true,
    status: 'active',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [isAdding, setIsAdding] = useState(false);

  // Delete User Confirmation State
  const [deletingUser, setDeletingUser] = useState<PublicUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        if (res.status === 403) {
          router.replace('/dashboard');
          return;
        }
        throw new Error('Failed to load users');
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      toast({
        title: 'Error loading users',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        router.replace('/dashboard');
      } else {
        fetchUsers();
      }
    }
  }, [authLoading, isAdmin, router, fetchUsers]);

  const handleOpenEditModal = (u: PublicUser) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditPermissions({
      canAccessAI: u.permissions?.canAccessAI ?? true,
      canManageBudgets: u.permissions?.canManageBudgets ?? true,
      canExportReports: u.permissions?.canExportReports ?? false,
      canManageCommunity: u.permissions?.canManageCommunity ?? true,
      status: u.permissions?.status ?? 'active',
    });
  };

  const handleSavePrivileges = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole,
          permissions: editPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user privileges');
      }

      toast({
        title: 'Privileges Updated',
        description: `Updated privileges for ${editingUser.displayName || editingUser.username}.`,
      });

      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRoleQuick = async (targetUser: PublicUser) => {
    if (targetUser.username.toLowerCase() === 'admin' && targetUser.role === 'admin') {
      toast({
        title: 'Action Denied',
        description: 'Cannot demote the primary root admin account.',
        variant: 'destructive',
      });
      return;
    }

    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: nextRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');

      toast({
        title: 'Role Changed',
        description: `${targetUser.username} is now a ${nextRole}.`,
      });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatusQuick = async (targetUser: PublicUser) => {
    if (targetUser.username.toLowerCase() === 'admin') {
      toast({
        title: 'Action Denied',
        description: 'Cannot suspend the root admin account.',
        variant: 'destructive',
      });
      return;
    }

    const nextStatus = targetUser.permissions?.status === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: {
            ...targetUser.permissions,
            status: nextStatus,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');

      toast({
        title: 'Status Updated',
        description: `Account is now ${nextStatus}.`,
      });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail || !newPassword) {
      toast({ title: 'Missing fields', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          displayName: newDisplayName || newUsername,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      toast({
        title: 'User Created',
        description: `Successfully added ${newUsername}.`,
      });

      setIsAddUserOpen(false);
      setNewUsername('');
      setNewEmail('');
      setNewDisplayName('');
      setNewPassword('');
      setNewRole('user');
      fetchUsers();
    } catch (err: any) {
      toast({
        title: 'Creation Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      toast({
        title: 'User Deleted',
        description: `Account ${deletingUser.username} removed.`,
      });

      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast({
        title: 'Deletion Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.displayName && u.displayName.toLowerCase().includes(q))
    );
  });

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const activeCount = users.filter((u) => u.permissions?.status !== 'suspended').length;
  const suspendedCount = totalUsers - activeCount;

  if (authLoading || (!isAdmin && loading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Admin Control Panel</h1>
            <Badge className="bg-primary/15 text-primary border-primary/30 flex items-center gap-1 font-semibold text-xs">
              <Shield className="w-3.5 h-3.5" /> Super Admin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage site members, assign administrative rights, and configure individual access privileges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsAddUserOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Plus className="w-4 h-4 mr-1.5" />
            Add User
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Users
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administrators
            </CardTitle>
            <Shield className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{adminCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Full management access</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Accounts
            </CardTitle>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Unrestricted access</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Suspended
            </CardTitle>
            <UserX className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{suspendedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Blocked from login</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management Section */}
      <Card className="border-border shadow-md">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">User Directory & Privilege Matrix</CardTitle>
              <CardDescription>
                Click <strong>Edit Privileges</strong> on any user to adjust their individual permissions.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                type="text"
                placeholder="Search username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Active Privileges</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                      {searchQuery ? 'No users matching your search.' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isRootAdmin = u.username.toLowerCase() === 'admin';
                    const isCurrentUser = user?.id === u.id;
                    const perms = u.permissions || {
                      canAccessAI: true,
                      canManageBudgets: true,
                      canExportReports: false,
                      canManageCommunity: true,
                      status: 'active',
                    };

                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        {/* User Identity */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                              {(u.displayName || u.username || 'U').charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-1.5">
                                {u.displayName || u.username}
                                {isCurrentUser && (
                                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">@{u.username} • {u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleRoleQuick(u)}
                            disabled={isRootAdmin}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                              u.role === 'admin'
                                ? 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/25'
                                : 'bg-secondary text-secondary-foreground border-border hover:bg-muted'
                            } ${isRootAdmin ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
                            title={isRootAdmin ? 'Root Admin' : 'Click to toggle role'}
                          >
                            <Shield className="w-3 h-3" />
                            {u.role === 'admin' ? 'Admin' : 'Standard User'}
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleStatusQuick(u)}
                            disabled={isRootAdmin}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              perms.status === 'suspended'
                                ? 'bg-destructive/15 text-destructive border border-destructive/25'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                            } ${isRootAdmin ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                            title={isRootAdmin ? 'Active' : 'Click to toggle status'}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {perms.status === 'suspended' ? 'Suspended' : 'Active'}
                          </button>
                        </td>

                        {/* Privileges Chips */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                                perms.canAccessAI
                                  ? 'bg-primary/10 text-primary border border-primary/20'
                                  : 'bg-muted text-muted-foreground line-through opacity-50'
                              }`}
                            >
                              <Bot className="w-3 h-3" /> AI Insights
                            </span>

                            <span
                              className={`text-[11px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                                perms.canManageBudgets
                                  ? 'bg-accent/15 text-accent-foreground border border-accent/30'
                                  : 'bg-muted text-muted-foreground line-through opacity-50'
                              }`}
                            >
                              <Activity className="w-3 h-3" /> Budgets
                            </span>

                            <span
                              className={`text-[11px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                                perms.canExportReports
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                  : 'bg-muted text-muted-foreground line-through opacity-50'
                              }`}
                            >
                              <FileSpreadsheet className="w-3 h-3" /> Export
                            </span>

                            <span
                              className={`text-[11px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                                perms.canManageCommunity
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                  : 'bg-muted text-muted-foreground line-through opacity-50'
                              }`}
                            >
                              <MessageSquare className="w-3 h-3" /> Community
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => handleOpenEditModal(u)}
                          >
                            <Sliders className="w-3.5 h-3.5 mr-1" />
                            Edit Privileges
                          </Button>

                          {!isRootAdmin && !isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                              onClick={() => setDeletingUser(u)}
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* EDIT PRIVILEGES DIALOG */}
      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sliders className="w-5 h-5 text-primary" />
              Manage Privileges: @{editingUser?.username}
            </DialogTitle>
            <DialogDescription>
              Assign roles and granular permissions for {editingUser?.displayName || editingUser?.username}.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-6 py-2">
              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Access Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditRole('user')}
                    disabled={editingUser.username.toLowerCase() === 'admin'}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editRole === 'user'
                        ? 'border-primary bg-primary/10 text-foreground font-semibold'
                        : 'border-border hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <div className="text-sm font-semibold">Standard User</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Regular client dashboard</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('admin')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editRole === 'admin'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <div className="text-sm font-semibold flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Administrator
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Full privilege manager</div>
                  </button>
                </div>
              </div>

              {/* Granular Permissions */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Feature Privileges
                </label>

                {/* AI Advisor */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-2.5">
                    <Bot className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Genkit AI Advisor</div>
                      <div className="text-xs text-muted-foreground">Access automated financial forecasting tips</div>
                    </div>
                  </div>
                  <Switch
                    checked={editPermissions.canAccessAI}
                    onCheckedChange={(val) => setEditPermissions({ ...editPermissions, canAccessAI: val })}
                  />
                </div>

                {/* Budgets & Goals */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-accent" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Budget & Expense Tracking</div>
                      <div className="text-xs text-muted-foreground">Create budgets and record daily expenses</div>
                    </div>
                  </div>
                  <Switch
                    checked={editPermissions.canManageBudgets}
                    onCheckedChange={(val) => setEditPermissions({ ...editPermissions, canManageBudgets: val })}
                  />
                </div>

                {/* Export Reports */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Tax & Report Exports</div>
                      <div className="text-xs text-muted-foreground">Download Schedule C and tax summaries</div>
                    </div>
                  </div>
                  <Switch
                    checked={editPermissions.canExportReports}
                    onCheckedChange={(val) => setEditPermissions({ ...editPermissions, canExportReports: val })}
                  />
                </div>

                {/* Community */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Community Forum</div>
                      <div className="text-xs text-muted-foreground">Post and interact in discussions</div>
                    </div>
                  </div>
                  <Switch
                    checked={editPermissions.canManageCommunity}
                    onCheckedChange={(val) => setEditPermissions({ ...editPermissions, canManageCommunity: val })}
                  />
                </div>

                {/* Account Status */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-2.5">
                    <UserX className="w-4 h-4 text-destructive" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Account Active</div>
                      <div className="text-xs text-muted-foreground">Turn off to suspend user access</div>
                    </div>
                  </div>
                  <Switch
                    checked={editPermissions.status === 'active'}
                    disabled={editingUser.username.toLowerCase() === 'admin'}
                    onCheckedChange={(val) =>
                      setEditPermissions({ ...editPermissions, status: val ? 'active' : 'suspended' })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSavePrivileges} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSaving ? 'Saving Changes...' : 'Save Privileges'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD USER DIALOG */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5 text-primary" />
                Add New Member
              </DialogTitle>
              <DialogDescription>
                Create an account and assign their starting role and privileges.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Username *</label>
                <Input
                  type="text"
                  placeholder="e.g. sarah"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Display Name</label>
                <Input
                  type="text"
                  placeholder="Sarah Connor"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Email *</label>
                <Input
                  type="email"
                  placeholder="sarah@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Initial Password *</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={newRole === 'user' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewRole('user')}
                    className="w-full text-xs"
                  >
                    Standard User
                  </Button>
                  <Button
                    type="button"
                    variant={newRole === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewRole('admin')}
                    className="w-full text-xs"
                  >
                    Administrator
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={isAdding}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAdding} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                {isAdding ? 'Adding...' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={Boolean(deletingUser)} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-lg">
              <AlertCircle className="w-5 h-5" /> Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete user{' '}
              <strong>@{deletingUser?.username}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeletingUser(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
