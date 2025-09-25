import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppHeader } from '@/components/navigation/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Settings, BarChart3, Shield, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('cohorts');

  // Fetch user profile to determine admin role
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile'],
  });

  // Fetch cohorts based on admin role
  const { data: cohorts, isLoading: cohortsLoading, error: cohortsError } = useQuery<Cohort[]>({
    queryKey: ['/api/cohorts'],
    enabled: !!userProfile && (userProfile.role === 'admin' || userProfile.role === 'super_admin'),
  });

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
                  <Button size="lg" data-testid="button-create-cohort">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Cohort
                  </Button>
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
                                  <Button variant="outline" size="sm" className="flex-1">
                                    View Users
                                  </Button>
                                  {(isSuperAdmin || cohort.id === userProfile.cohortId) && (
                                    <Button variant="outline" size="sm" className="flex-1">
                                      Edit
                                    </Button>
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
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Cohort
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Overview</CardTitle>
                  <CardDescription>
                    View assessment performance and insights across cohorts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
                    <p className="text-muted-foreground">
                      Comprehensive analytics and reporting features will be available here
                    </p>
                  </div>
                </CardContent>
              </Card>
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
      </div>
    </ProtectedRoute>
  );
}