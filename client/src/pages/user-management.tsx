import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppHeader } from '@/components/navigation/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Shield, 
  User as UserIcon, 
  Trash2, 
  Edit,
  Filter,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Types
interface UserWithCohort {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  cohortId: string | null;
  lastActiveAt?: string | null;
  invitedBy?: string | null;
  createdAt?: string | null;
  cohort?: {
    id: string;
    code: string;
    name: string;
    status: string;
  } | null;
}

interface Cohort {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
}

export default function UserManagement() {
  const { toast } = useToast();
  const { userProfile, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [cohortFilter, setCohortFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<UserWithCohort | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithCohort | null>(null);

  // Redirect non-admins (both admin and super_admin can access)
  useEffect(() => {
    if (!authLoading && userProfile && userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [authLoading, userProfile, navigate, toast]);

  const isSuperAdmin = userProfile?.role === 'super_admin';

  // Fetch all users (admin and super admin only)
  const { data: users, isLoading: usersLoading } = useQuery<UserWithCohort[]>({
    queryKey: ['/api/users/admin/all-users'],
    enabled: userProfile?.role === 'admin' || userProfile?.role === 'super_admin',
  });

  // Fetch cohorts for cohort selection
  const { data: cohorts } = useQuery<Cohort[]>({
    queryKey: ['/api/cohorts'],
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'user' | 'admin' | 'super_admin' }) => {
      return apiRequest('PATCH', `/api/users/admin/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/admin/all-users'] });
      setEditingUser(null);
      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    },
  });

  // Update user cohort mutation
  const updateCohortMutation = useMutation({
    mutationFn: async ({ userId, cohortId }: { userId: string; cohortId: string | null }) => {
      return apiRequest('PATCH', `/api/users/admin/${userId}/cohort`, { cohortId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/admin/all-users'] });
      toast({
        title: 'Success',
        description: 'User cohort updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user cohort',
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('DELETE', `/api/users/admin/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/admin/all-users'] });
      setDeletingUser(null);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    },
  });

  // Filter users based on search query and filters
  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.cohort?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesCohort = cohortFilter === 'all' || 
      (cohortFilter === 'none' && !user.cohortId) ||
      (user.cohortId === cohortFilter);

    return matchesSearch && matchesRole && matchesCohort;
  }) || [];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <ShieldCheck className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      default:
        return <UserIcon className="h-3 w-3" />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppHeader />
        
        <main className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">
                Manage all users, roles, and cohort memberships
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              <Users className="h-3 w-3 mr-1" />
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
            </Badge>
          </div>

          {!isSuperAdmin && (
            <Alert data-testid="alert-admin-restrictions">
              <Info className="h-4 w-4" />
              <AlertDescription>
                As an admin, you can manage regular users and update cohort memberships. 
                Only super admins can create, modify, or delete other admin or super admin accounts.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Find users by email, ID, or cohort name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    data-testid="input-user-search"
                    placeholder="Search by email, user ID, or cohort..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger data-testid="select-role-filter" className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={cohortFilter} onValueChange={setCohortFilter}>
                  <SelectTrigger data-testid="select-cohort-filter" className="w-full sm:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by cohort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cohorts</SelectItem>
                    <SelectItem value="none">No Cohort</SelectItem>
                    {cohorts?.map(cohort => (
                      <SelectItem key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {filteredUsers.length === users?.length
                  ? `Showing all ${users?.length || 0} users`
                  : `Showing ${filteredUsers.length} of ${users?.length || 0} users`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading users...</div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No users found</p>
                  {searchQuery && (
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filters
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Cohort</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.userId} data-testid={`row-user-${user.userId}`}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{user.email}</span>
                              <span className="text-xs text-muted-foreground">
                                {user.userId.slice(0, 8)}...
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={getRoleBadgeVariant(user.role)}
                              className="gap-1"
                              data-testid={`badge-role-${user.userId}`}
                            >
                              {getRoleIcon(user.role)}
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.cohort ? (
                              <div className="flex flex-col">
                                <span className="text-sm">{user.cohort.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {user.cohort.code}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No cohort</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.createdAt 
                              ? new Date(user.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                data-testid={`button-edit-${user.userId}`}
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingUser(user)}
                                disabled={!isSuperAdmin && (user.role === 'admin' || user.role === 'super_admin')}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                data-testid={`button-delete-${user.userId}`}
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingUser(user)}
                                disabled={!isSuperAdmin && (user.role === 'admin' || user.role === 'super_admin')}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Edit User Dialog */}
        {editingUser && (
          <AlertDialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <AlertDialogContent data-testid="dialog-edit-user">
              <AlertDialogHeader>
                <AlertDialogTitle>Edit User</AlertDialogTitle>
                <AlertDialogDescription>
                  Update role and cohort membership for {editingUser.email}
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  {isSuperAdmin ? (
                    <Select
                      data-testid="select-edit-role"
                      defaultValue={editingUser.role}
                      onValueChange={(value) => {
                        updateRoleMutation.mutate({
                          userId: editingUser.userId,
                          role: value as 'user' | 'admin' | 'super_admin'
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      <Select
                        data-testid="select-edit-role"
                        defaultValue={editingUser.role}
                        onValueChange={(value) => {
                          if (value === 'user') {
                            updateRoleMutation.mutate({
                              userId: editingUser.userId,
                              role: 'user'
                            });
                          }
                        }}
                        disabled={editingUser.role === 'admin' || editingUser.role === 'super_admin'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                      {(editingUser.role === 'admin' || editingUser.role === 'super_admin') && (
                        <p className="text-xs text-muted-foreground">
                          Only super admins can modify admin roles
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Cohort</label>
                  <Select
                    data-testid="select-edit-cohort"
                    defaultValue={editingUser.cohortId || 'none'}
                    onValueChange={(value) => {
                      updateCohortMutation.mutate({
                        userId: editingUser.userId,
                        cohortId: value === 'none' ? null : value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Cohort</SelectItem>
                      {cohorts?.map(cohort => (
                        <SelectItem key={cohort.id} value={cohort.id}>
                          {cohort.name} ({cohort.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-edit">Done</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Delete User Confirmation Dialog */}
        {deletingUser && (
          <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
            <AlertDialogContent data-testid="dialog-delete-user">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {deletingUser.email}? This will permanently 
                  remove the user and all their assessment data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  data-testid="button-confirm-delete"
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteUserMutation.mutate(deletingUser.userId)}
                >
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </ProtectedRoute>
  );
}
