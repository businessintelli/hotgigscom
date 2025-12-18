import { useAuth } from "@/_core/hooks/useAuth";
import RecruiterLayout from "@/components/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Plus, Building2, Mail, Phone, Globe, MapPin, Edit, Trash2, Users, Briefcase, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";

export default function CustomerManagement() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const ITEMS_PER_PAGE = 12;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    website: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
  });

  const utils = trpc.useUtils();

  // Fetch recruiter profile
  const { data: recruiter } = trpc.recruiter.getProfile.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  // Fetch all customers
  const { data: customers = [], isLoading: customersLoading } = trpc.customer.list.useQuery(
    undefined,
    { enabled: !!recruiter?.id }
  );

  // Create customer mutation
  const createMutation = trpc.customer.create.useMutation({
    onSuccess: () => {
      utils.customer.list.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Customer created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create customer: ${error.message}`);
    },
  });

  // Update customer mutation
  const updateMutation = trpc.customer.update.useMutation({
    onSuccess: () => {
      utils.customer.list.invalidate();
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      resetForm();
      toast.success("Customer updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update customer: ${error.message}`);
    },
  });

  // Delete customer mutation
  const deleteMutation = trpc.customer.delete.useMutation({
    onSuccess: () => {
      utils.customer.list.invalidate();
      toast.success("Customer deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete customer: ${error.message}`);
    },
  });

  if (authLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const resetForm = () => {
    setFormData({
      name: "",
      industry: "",
      website: "",
      description: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
    });
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Customer name is required");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedCustomer || !formData.name) {
      toast.error("Customer name is required");
      return;
    }
    updateMutation.mutate({
      id: selectedCustomer.id,
      ...formData,
    });
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || "",
      industry: customer.industry || "",
      website: customer.website || "",
      description: customer.description || "",
      contactEmail: customer.contactEmail || "",
      contactPhone: customer.contactPhone || "",
      address: customer.address || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter((customer: any) =>
    !searchQuery ||
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedCustomers,
    goToPage,
    nextPage,
    prevPage,
  } = usePagination(filteredCustomers, ITEMS_PER_PAGE);

  return (
    <RecruiterLayout title="Clients">
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setLocation("/recruiter/dashboard")}>
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
                <p className="text-sm text-gray-600">Manage your client companies and relationships</p>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                  <DialogDescription>
                    Create a new customer profile to manage jobs and relationships
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="Technology, Healthcare, Finance..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the company..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St, City, State, ZIP"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Customer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                  <p className="text-sm text-gray-600">Total Customers</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter((c: any) => c.industry === "Technology").length}
                  </p>
                  <p className="text-sm text-gray-600">Tech Companies</p>
                </div>
                <Briefcase className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">Placements</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers by name or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers List */}
        <Card>
          <CardHeader>
            <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
            <CardDescription>Manage your client companies and track relationships</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {searchQuery ? "No customers found" : "No customers yet"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Customer
                  </Button>
                )}
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedCustomers.map((customer: any) => (
                  <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{customer.name}</CardTitle>
                          {customer.industry && (
                            <Badge variant="outline" className="mt-2">
                              {customer.industry}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(customer.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {customer.description && (
                          <p className="text-gray-600 line-clamp-2">{customer.description}</p>
                        )}
                        {customer.website && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Globe className="h-4 w-4" />
                            <a
                              href={customer.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600 truncate"
                            >
                              {customer.website}
                            </a>
                          </div>
                        )}
                        {customer.contactEmail && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{customer.contactEmail}</span>
                          </div>
                        )}
                        {customer.contactPhone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{customer.contactPhone}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">{customer.address}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-gray-500">
                        <span>0 Active Jobs</span>
                        <span>0 Placements</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredCustomers.length}
                  pageSize={ITEMS_PER_PAGE}
                  onPageChange={goToPage}
                />
              )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information and contact details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Company Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <Label htmlFor="edit-industry">Industry</Label>
              <Input
                id="edit-industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Technology, Healthcare, Finance..."
              />
            </div>
            <div>
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the company..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-contactEmail">Contact Email</Label>
              <Input
                id="edit-contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-contactPhone">Contact Phone</Label>
              <Input
                id="edit-contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State, ZIP"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </RecruiterLayout>
  );
}
