import { useAuth } from "@/_core/hooks/useAuth";
import RecruiterLayout from "@/components/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useToast } from "@/hooks/use-toast";

export default function EditJob() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/recruiter/jobs/:id/edit");
  const jobId = parseInt(params?.id || "0");

  const { data: job, isLoading } = trpc.job.getById.useQuery(
    { id: jobId },
    { enabled: !!jobId }
  );

  const { data: customers } = trpc.customer.list.useQuery();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
    location: "",
    employmentType: "full-time" as "full-time" | "part-time" | "contract" | "temporary" | "internship",
    salaryMin: "",
    salaryMax: "",
    customerId: "",
    status: "active" as "draft" | "active" | "closed" | "filled",
    isPublic: true,
  });

  // Populate form when job data loads
  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        description: job.description || "",
        requirements: job.requirements || "",
        responsibilities: job.responsibilities || "",
        location: job.location || "",
        employmentType: (job.employmentType as any) || "full-time",
        salaryMin: job.salaryMin?.toString() || "",
        salaryMax: job.salaryMax?.toString() || "",
        customerId: job.customerId?.toString() || "",
        status: (job.status as any) || "active",
        isPublic: job.isPublic ?? true,
      });
    }
  }, [job]);

  const updateMutation = trpc.job.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Job Updated",
        description: "The job posting has been updated successfully.",
      });
      setLocation(`/jobs/${jobId}`);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update job posting.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateMutation.mutate({
      id: jobId,
      title: formData.title,
      description: formData.description,
      requirements: formData.requirements || undefined,
      responsibilities: formData.responsibilities || undefined,
      location: formData.location || undefined,
      employmentType: formData.employmentType,
      salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : undefined,
      salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : undefined,
      customerId: formData.customerId ? parseInt(formData.customerId) : undefined,
      status: formData.status,
      isPublic: formData.isPublic,
    });
  };

  if (isLoading) {
    return (
      <RecruiterLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading job details...</p>
          </div>
        </div>
      </RecruiterLayout>
    );
  }

  if (!job) {
    return (
      <RecruiterLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
            <p className="text-gray-600 mb-4">The job you're trying to edit doesn't exist.</p>
            <Button onClick={() => setLocation("/recruiter/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <div className="container max-w-4xl py-8">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/recruiter/dashboard" },
            { label: "Jobs", href: "/recruiter/jobs" },
            { label: job.title, href: `/jobs/${jobId}` },
            { label: "Edit" }
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Edit Job Posting</CardTitle>
            <CardDescription>Update the details of your job posting</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role, team, and company culture..."
                  rows={6}
                  required
                />
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="List the required skills and qualifications..."
                  rows={4}
                />
              </div>

              {/* Responsibilities */}
              <div className="space-y-2">
                <Label htmlFor="responsibilities">Responsibilities</Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  placeholder="Describe the key responsibilities..."
                  rows={4}
                />
              </div>

              {/* Location and Employment Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value: any) => setFormData({ ...formData, employmentType: value })}
                  >
                    <SelectTrigger id="employmentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Salary Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Minimum Salary</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                    placeholder="e.g., 80000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Maximum Salary</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                    placeholder="e.g., 120000"
                  />
                </div>
              </div>

              {/* Customer and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Client/Customer</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                  >
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation(`/jobs/${jobId}`)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RecruiterLayout>
  );
}
