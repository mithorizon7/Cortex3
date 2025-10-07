import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Shield, Key, Calendar, Users, Edit, Trash2, MoreHorizontal, Copy, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Types for bootstrap invites
interface BootstrapInvite {
  id: string;
  code: string;
  role: 'super_admin' | 'admin';
  allowedUses: number;
  remainingUses: number;
  expiresAt: string;
  issuedBy: string;
  status: 'active' | 'expired' | 'revoked';
  description?: string;
  createdAt: string;
  lastUsedAt?: string;
  usedBy: string[];
}

// Form validation schemas
const createBootstrapInviteSchema = z.object({
  role: z.enum(['super_admin', 'admin'], { required_error: 'Role is required' }),
  allowedUses: z.coerce.number().min(1, 'Must allow at least 1 use').max(100, 'Cannot exceed 100 uses'),
  expiresAt: z.string().min(1, 'Expiration date is required'),
  description: z.string().optional()
});

const updateBootstrapInviteSchema = z.object({
  expiresAt: z.string().min(1, 'Expiration date is required'),
  description: z.string().optional()
});

type CreateBootstrapInviteData = z.infer<typeof createBootstrapInviteSchema>;
type UpdateBootstrapInviteData = z.infer<typeof updateBootstrapInviteSchema>;

export function BootstrapInviteManagement() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingInvite, setEditingInvite] = useState<BootstrapInvite | null>(null);

  // Create form
  const createForm = useForm<CreateBootstrapInviteData>({
    resolver: zodResolver(createBootstrapInviteSchema),
    defaultValues: {
      role: 'admin',
      allowedUses: 1,
      expiresAt: '',
      description: ''
    }
  });

  // Edit form
  const editForm = useForm<UpdateBootstrapInviteData>({
    resolver: zodResolver(updateBootstrapInviteSchema),
    defaultValues: {
      expiresAt: '',
      description: ''
    }
  });

  // Fetch bootstrap invites
  const { data: invites, isLoading: invitesLoading, error: invitesError } = useQuery<BootstrapInvite[]>({
    queryKey: ['/api/bootstrap-invites'],
  });

  // Create invite mutation
  const createInviteMutation = useMutation({
    mutationFn: async (data: CreateBootstrapInviteData) => {
      return apiRequest('POST', '/api/bootstrap-invites', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bootstrap-invites'] });
      setCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: 'Success',
        description: 'Bootstrap invite created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bootstrap invite',
        variant: 'destructive',
      });
    },
  });

  // Update invite mutation
  const updateInviteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBootstrapInviteData }) => {
      return apiRequest('PUT', `/api/bootstrap-invites/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bootstrap-invites'] });
      setEditingInvite(null);
      editForm.reset();
      toast({
        title: 'Success',
        description: 'Bootstrap invite updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update bootstrap invite',
        variant: 'destructive',
      });
    },
  });

  // Revoke invite mutation
  const revokeInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/bootstrap-invites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bootstrap-invites'] });
      toast({
        title: 'Success',
        description: 'Bootstrap invite revoked successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke bootstrap invite',
        variant: 'destructive',
      });
    },
  });

  const handleCreateInvite = (data: CreateBootstrapInviteData) => {
    // Convert datetime-local to ISO string and allowedUses to number for backend compatibility
    const formattedData = {
      ...data,
      allowedUses: Number(data.allowedUses),
      expiresAt: new Date(data.expiresAt).toISOString()
    };
    createInviteMutation.mutate(formattedData);
  };

  const handleUpdateInvite = (data: UpdateBootstrapInviteData) => {
    if (editingInvite) {
      // Convert datetime-local to ISO string for backend compatibility
      const formattedData = {
        ...data,
        expiresAt: new Date(data.expiresAt).toISOString()
      };
      updateInviteMutation.mutate({ id: editingInvite.id, data: formattedData });
    }
  };

  const handleRevokeInvite = (inviteId: string) => {
    if (confirm('Are you sure you want to revoke this bootstrap invite? This action cannot be undone.')) {
      revokeInviteMutation.mutate(inviteId);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: 'Bootstrap code copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (invite: BootstrapInvite) => {
    setEditingInvite(invite);
    editForm.reset({
      expiresAt: new Date(invite.expiresAt).toISOString().slice(0, 16),
      description: invite.description || ''
    });
  };

  // Generate default expiry date (30 days from now)
  const getDefaultExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 16);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'expired': return 'secondary';
      case 'revoked': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <Calendar className="h-4 w-4" />;
      case 'revoked': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Bootstrap Invite Management</span>
              </CardTitle>
              <CardDescription>
                Create and manage reusable bootstrap invites for super admin and admin access
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-bootstrap-invite">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invite
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Bootstrap Invite</DialogTitle>
                  <DialogDescription>
                    Create a new reusable bootstrap invite for granting admin or super admin access.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreateInvite)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-invite-role">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="allowedUses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allowed Uses</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-invite-allowed-uses"
                            />
                          </FormControl>
                          <FormDescription>Number of times this invite can be used</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="expiresAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expires At</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              min={new Date().toISOString().slice(0, 16)}
                              defaultValue={getDefaultExpiryDate()}
                              data-testid="input-invite-expires-at"
                            />
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
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Description for this bootstrap invite..."
                              {...field}
                              data-testid="textarea-invite-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                        data-testid="button-cancel-create-invite"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createInviteMutation.isPending}
                        data-testid="button-submit-create-invite"
                      >
                        {createInviteMutation.isPending ? 'Creating...' : 'Create Invite'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {invitesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading bootstrap invites...</p>
            </div>
          ) : invitesError ? (
            <div className="text-center py-8">
              <p className="text-sm text-destructive">Failed to load bootstrap invites</p>
            </div>
          ) : invites && invites.length > 0 ? (
            <div className="space-y-4">
              {invites.map((invite) => (
                <Card key={invite.id} className="hover-elevate">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Key className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-medium text-lg">{invite.code}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(invite.code)}
                              data-testid={`button-copy-code-${invite.id}`}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invite.description || `Bootstrap invite for ${invite.role} access`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusBadgeVariant(invite.status)} className="flex items-center space-x-1">
                          {getStatusIcon(invite.status)}
                          <span>{invite.status}</span>
                        </Badge>
                        {invite.status === 'active' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" data-testid={`button-invite-menu-${invite.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(invite)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRevokeInvite(invite.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Revoke
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Role:</span>
                        <p className="font-medium">
                          {invite.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Uses:</span>
                        <p className="font-medium">
                          {invite.remainingUses} / {invite.allowedUses}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expires:</span>
                        <p className="font-medium">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <p className="font-medium">
                          {new Date(invite.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {invite.usedBy.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-muted-foreground text-sm">Used by:</span>
                        <div className="flex items-center space-x-1 mt-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{invite.usedBy.length} user(s)</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No bootstrap invites created yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first bootstrap invite to grant admin access
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingInvite} onOpenChange={(open) => !open && setEditingInvite(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Bootstrap Invite</DialogTitle>
            <DialogDescription>
              Update the description and expiration date for this bootstrap invite.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateInvite)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires At</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        min={new Date().toISOString().slice(0, 16)}
                        data-testid="input-edit-invite-expires-at"
                      />
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description for this bootstrap invite..."
                        {...field}
                        data-testid="textarea-edit-invite-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingInvite(null)}
                  data-testid="button-cancel-edit-invite"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateInviteMutation.isPending}
                  data-testid="button-submit-edit-invite"
                >
                  {updateInviteMutation.isPending ? 'Updating...' : 'Update Invite'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}