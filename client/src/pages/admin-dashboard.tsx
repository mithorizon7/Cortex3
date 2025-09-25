import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppHeader } from '@/components/navigation/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Users, Settings, BarChart3, Shield, AlertCircle, Edit, Trash2, MoreHorizontal, TrendingUp, Activity, Target, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Types for user profile and cohort data
interface UserProfile {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  cohortId: string | null;
  lastActiveAt?: string;
  invitedBy?: string;
  createdAt?: string;
}

interface Cohort {
  id: string;
  name: string;
  description: string;
  code: string;
  allowedSlots: number;
  usedSlots: number;
  status: 'active' | 'inactive';
  createdAt?: string;
}

// Form validation schemas
const createCohortSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  allowedSlots: z.number().min(1, 'Must allow at least 1 user').max(10000, 'Too many slots'),
  status: z.enum(['active', 'inactive']).default('active')
});

type CreateCohortData = z.infer<typeof createCohortSchema>;

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('cohorts');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);

  // Create cohort form
  const createForm = useForm<CreateCohortData>({
    resolver: zodResolver(createCohortSchema),
    defaultValues: {
      name: '',
      description: '',
      allowedSlots: 50,
      status: 'active'
    }
  });

  // Edit cohort form
  const editForm = useForm<CreateCohortData>({
    resolver: zodResolver(createCohortSchema),
    defaultValues: {
      name: '',
      description: '',
      allowedSlots: 50,
      status: 'active'
    }
  });

  // Fetch user profile to determine admin role
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile'],
  });

  // Fetch cohorts based on admin role
  const { data: cohorts, isLoading: cohortsLoading, error: cohortsError } = useQuery<Cohort[]>({
    queryKey: ['/api/cohorts'],
    enabled: !!userProfile && (userProfile.role === 'admin' || userProfile.role === 'super_admin'),
  });

  // Create cohort mutation
  const createCohortMutation = useMutation({
    mutationFn: async (data: CreateCohortData) => {
      return apiRequest('/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cohorts'] });
      setCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: 'Success',
        description: 'Cohort created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create cohort',
        variant: 'destructive',
      });
    },
  });

  // Update cohort mutation
  const updateCohortMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCohortData> }) => {
      return apiRequest(`/api/cohorts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cohorts'] });
      setEditingCohort(null);
      editForm.reset();
      toast({
        title: 'Success',
        description: 'Cohort updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update cohort',
        variant: 'destructive',
      });
    },
  });

  // Delete cohort mutation (for super admins)
  const deleteCohortMutation = useMutation({
    mutationFn: async (cohortId: string) => {
      return apiRequest(`/api/cohorts/${cohortId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cohorts'] });
      toast({
        title: 'Success',
        description: 'Cohort deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete cohort',
        variant: 'destructive',
      });
    },
  });

  // Handle form submissions
  const handleCreateCohort = (data: CreateCohortData) => {
    createCohortMutation.mutate(data);
  };

  const handleUpdateCohort = (data: CreateCohortData) => {
    if (editingCohort) {
      updateCohortMutation.mutate({ id: editingCohort.id, data });
    }
  };

  const handleDeleteCohort = (cohortId: string) => {
    if (confirm('Are you sure you want to delete this cohort? This action cannot be undone.')) {
      deleteCohortMutation.mutate(cohortId);
    }
  };

  const openEditDialog = (cohort: Cohort) => {
    setEditingCohort(cohort);
    editForm.reset({
      name: cohort.name,
      description: cohort.description,
      allowedSlots: cohort.allowedSlots,
      status: cohort.status,
    });
  };

  // Loading states
  if (profileLoading) {
    return (
      <ProtectedRoute requireAuth>
        <div className="min-h-screen bg-background">
          <AppHeader 
            showIdentityInline 
            identityText="Admin Dashboard"
            showHelp={false}
          />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading admin dashboard...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Access control - redirect if not admin
  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <ProtectedRoute requireAuth>
        <div className="min-h-screen bg-background">
          <AppHeader 
            showIdentityInline 
            identityText="Access Denied"
            showHelp={false}
          />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-destructive">Access Denied</CardTitle>
                </div>
                <CardDescription>
                  You don't have permission to access the admin dashboard. Contact your system administrator for access.
                </CardDescription>
              </CardHeader>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const isSuperAdmin = userProfile.role === 'super_admin';

  return (
    <ProtectedRoute requireAuth>
      <div className="min-h-screen bg-background">
        <AppHeader 
          showIdentityInline 
          identityText={`Admin Dashboard • ${isSuperAdmin ? 'Super Admin' : 'Admin'}`}
          showHelp={false}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-lg text-muted-foreground">
                  Manage cohorts, users, and view analytics
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={isSuperAdmin ? "default" : "secondary"}>
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </Badge>
                {isSuperAdmin && (
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" data-testid="button-create-cohort">
                        <Plus className="h-5 w-5 mr-2" />
                        Create Cohort
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            </div>
          </div>

          {/* Error State */}
          {cohortsError && (
            <Card className="border-destructive/50 bg-destructive/5 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-destructive">Failed to load cohorts. Please try again.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="cohorts" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Cohorts</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Cohorts Tab */}
            <TabsContent value="cohorts" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cohort Management</CardTitle>
                    <CardDescription>
                      {isSuperAdmin 
                        ? 'View and manage all cohorts in the system'
                        : 'Manage your assigned cohort'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {cohortsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-sm text-muted-foreground">Loading cohorts...</p>
                      </div>
                    ) : cohorts && cohorts.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {cohorts.map((cohort: any) => (
                          <Card key={cohort.id} className="hover-elevate">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{cohort.name}</CardTitle>
                                <Badge variant={cohort.status === 'active' ? 'default' : 'secondary'}>
                                  {cohort.status}
                                </Badge>
                              </div>
                              <CardDescription className="text-sm">
                                {cohort.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Members:</span>
                                  <span className="font-medium">
                                    {cohort.usedSlots} / {cohort.allowedSlots}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Access Code:</span>
                                  <span className="font-mono font-medium">{cohort.code}</span>
                                </div>
                                <div className="pt-2 flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1"
                                    data-testid={`button-view-users-${cohort.id}`}
                                  >
                                    View Users
                                  </Button>
                                  {(isSuperAdmin || cohort.id === userProfile.cohortId) && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex-1"
                                      onClick={() => openEditDialog(cohort)}
                                      data-testid={`button-edit-cohort-${cohort.id}`}
                                      disabled={updateCohortMutation.isPending}
                                    >
                                      Edit
                                    </Button>
                                  )}
                                  {isSuperAdmin && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          data-testid={`button-cohort-menu-${cohort.id}`}
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem 
                                          onClick={() => openEditDialog(cohort)}
                                          data-testid={`menu-edit-cohort-${cohort.id}`}
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteCohort(cohort.id)}
                                          className="text-destructive"
                                          data-testid={`menu-delete-cohort-${cohort.id}`}
                                          disabled={deleteCohortMutation.isPending}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete Cohort
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Cohorts Found</h3>
                        <p className="text-muted-foreground mb-4">
                          {isSuperAdmin 
                            ? 'Get started by creating your first cohort'
                            : 'You are not assigned to any cohort yet'
                          }
                        </p>
                        {isSuperAdmin && (
                          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                              <Button data-testid="button-create-first-cohort">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Cohort
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsOverview />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Settings</CardTitle>
                  <CardDescription>
                    Configure system settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Settings Coming Soon</h3>
                    <p className="text-muted-foreground">
                      System configuration options will be available here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* Create Cohort Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Cohort</DialogTitle>
              <DialogDescription>
                Create a new cohort for organizing users. A unique access code will be generated automatically.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateCohort)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cohort Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter cohort name" {...field} data-testid="input-cohort-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the purpose and goals of this cohort"
                          {...field}
                          data-testid="input-cohort-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="allowedSlots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Members</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10000"
                          placeholder="50"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-cohort-slots"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of users that can join this cohort
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCreateDialogOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCohortMutation.isPending}
                    data-testid="button-confirm-create"
                  >
                    {createCohortMutation.isPending ? 'Creating...' : 'Create Cohort'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Cohort Dialog */}
        <Dialog open={!!editingCohort} onOpenChange={(open) => !open && setEditingCohort(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Cohort</DialogTitle>
              <DialogDescription>
                Update cohort details. The access code cannot be changed.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdateCohort)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cohort Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter cohort name" {...field} data-testid="input-edit-cohort-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the purpose and goals of this cohort"
                          {...field}
                          data-testid="input-edit-cohort-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="allowedSlots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Members</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-edit-cohort-slots"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of users that can join this cohort
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select 
                          {...field} 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          data-testid="select-edit-cohort-status"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </FormControl>
                      <FormDescription>
                        Only active cohorts can accept new members
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingCohort(null)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateCohortMutation.isPending}
                    data-testid="button-confirm-edit"
                  >
                    {updateCohortMutation.isPending ? 'Updating...' : 'Update Cohort'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}

// Analytics Overview Component
function AnalyticsOverview() {
  const { toast } = useToast();

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['/api/cohorts/analytics/overview'],
    enabled: true
  });

  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded animate-pulse mb-1" />
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (analyticsError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to Load Analytics</h3>
            <p className="text-muted-foreground">
              Unable to fetch analytics data. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData || analyticsData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground">
              Create cohorts and assessments to view analytics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate aggregate metrics
  const totalMembers = analyticsData.reduce((sum: number, cohort: any) => sum + cohort.totalMembers, 0);
  const totalAssessments = analyticsData.reduce((sum: number, cohort: any) => sum + cohort.totalAssessments, 0);
  const completedAssessments = analyticsData.reduce((sum: number, cohort: any) => sum + cohort.completedAssessments, 0);
  const avgCompletionRate = analyticsData.length > 0 
    ? analyticsData.reduce((sum: number, cohort: any) => sum + cohort.completionRate, 0) / analyticsData.length 
    : 0;

  // Prepare chart data
  const cohortCompletionData = analyticsData.map((cohort: any) => ({
    name: cohort.cohortName,
    completionRate: Math.round(cohort.completionRate),
    total: cohort.totalAssessments,
    completed: cohort.completedAssessments,
  }));

  const pillarData = [
    { pillar: 'Clarity', avg: analyticsData.reduce((sum: number, c: any) => sum + (c.averagePillarScores.C || 0), 0) / analyticsData.length },
    { pillar: 'Operations', avg: analyticsData.reduce((sum: number, c: any) => sum + (c.averagePillarScores.O || 0), 0) / analyticsData.length },
    { pillar: 'Risk/Trust', avg: analyticsData.reduce((sum: number, c: any) => sum + (c.averagePillarScores.R || 0), 0) / analyticsData.length },
    { pillar: 'Talent', avg: analyticsData.reduce((sum: number, c: any) => sum + (c.averagePillarScores.T || 0), 0) / analyticsData.length },
    { pillar: 'Ecosystem', avg: analyticsData.reduce((sum: number, c: any) => sum + (c.averagePillarScores.E || 0), 0) / analyticsData.length },
    { pillar: 'Evolution', avg: analyticsData.reduce((sum: number, c: any) => sum + (c.averagePillarScores.X || 0), 0) / analyticsData.length },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-members">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Across {analyticsData.length} cohort{analyticsData.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-assessments">{totalAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {completedAssessments} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-completion-rate">{Math.round(avgCompletionRate)}%</div>
            <p className="text-xs text-muted-foreground">
              {completedAssessments} of {totalAssessments} assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cohorts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-active-cohorts">
              {analyticsData.filter((c: any) => c.cohortStatus === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.filter((c: any) => c.cohortStatus !== 'active').length} inactive
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Completion Rate by Cohort */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate by Cohort</CardTitle>
            <CardDescription>Assessment completion percentage per cohort</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cohortCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any, name: string) => [`${value}%`, 'Completion Rate']} />
                <Bar dataKey="completionRate" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Pillar Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Average Pillar Scores</CardTitle>
            <CardDescription>Performance across assessment domains</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pillarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pillar" />
                <YAxis domain={[0, 3]} />
                <Tooltip formatter={(value: any) => [value?.toFixed(2), 'Average Score']} />
                <Bar dataKey="avg" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cohort Performance Details</CardTitle>
          <CardDescription>Detailed analytics for each cohort</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Cohort</th>
                  <th className="text-left py-2">Members</th>
                  <th className="text-left py-2">Assessments</th>
                  <th className="text-left py-2">Completion Rate</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.map((cohort: any) => (
                  <tr key={cohort.cohortId} className="border-b">
                    <td className="py-2">
                      <div>
                        <div className="font-medium" data-testid={`cohort-name-${cohort.cohortId}`}>
                          {cohort.cohortName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Code: {cohort.cohortCode}
                        </div>
                      </div>
                    </td>
                    <td className="py-2" data-testid={`cohort-members-${cohort.cohortId}`}>
                      {cohort.totalMembers}/{cohort.allowedSlots}
                    </td>
                    <td className="py-2" data-testid={`cohort-assessments-${cohort.cohortId}`}>
                      {cohort.completedAssessments}/{cohort.totalAssessments}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-[60px]">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(cohort.completionRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm" data-testid={`cohort-completion-${cohort.cohortId}`}>
                          {Math.round(cohort.completionRate)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2">
                      <Badge 
                        variant={cohort.cohortStatus === 'active' ? 'default' : 'secondary'}
                        data-testid={`cohort-status-${cohort.cohortId}`}
                      >
                        {cohort.cohortStatus}
                      </Badge>
                    </td>
                    <td className="py-2 text-sm text-muted-foreground" data-testid={`cohort-activity-${cohort.cohortId}`}>
                      {cohort.lastActivity 
                        ? new Date(cohort.lastActivity).toLocaleDateString()
                        : 'No activity'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}