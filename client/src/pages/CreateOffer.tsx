import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send } from "lucide-react";

export default function CreateOffer() {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Parse query parameters for application context
  const params = new URLSearchParams(location.split('?')[1]);
  const applicationId = params.get('applicationId');
  const jobId = params.get('jobId');
  const candidateId = params.get('candidateId');

  // Form state
  const [formData, setFormData] = useState({
    offerTitle: "",
    salaryType: "annual" as "annual" | "hourly" | "contract",
    baseSalary: "",
    signOnBonus: "",
    performanceBonus: "",
    equityShares: "",
    equityValue: "",
    healthInsurance: false,
    dentalInsurance: false,
    visionInsurance: false,
    retirement401k: false,
    retirement401kMatch: "",
    paidTimeOff: "",
    sickLeave: "",
    parentalLeave: "",
    startDate: "",
    workLocation: "",
    workType: "remote" as "remote" | "hybrid" | "onsite",
    department: "",
    reportingTo: "",
    probationPeriod: "",
    noticePeriod: "",
    nonCompeteClause: false,
    nonCompeteDuration: "",
    relocationAssistance: false,
    relocationAmount: "",
    recruiterNotes: "",
    expiresAt: "",
  });

  // Mutations
  const createOfferMutation = trpc.offerManagement.createOffer.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Offer Created",
        description: "The offer has been created successfully.",
      });
      setLocation("/offer-management");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (sendImmediately: boolean = false) => {
    if (!applicationId || !jobId || !candidateId) {
      toast({
        title: "Error",
        description: "Missing required application information.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.offerTitle || !formData.baseSalary || !formData.workLocation) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    await createOfferMutation.mutateAsync({
      applicationId: parseInt(applicationId),
      jobId: parseInt(jobId),
      candidateId: parseInt(candidateId),
      offerTitle: formData.offerTitle,
      salaryType: formData.salaryType,
      baseSalary: parseInt(formData.baseSalary),
      signOnBonus: formData.signOnBonus ? parseInt(formData.signOnBonus) : undefined,
      performanceBonus: formData.performanceBonus ? parseInt(formData.performanceBonus) : undefined,
      equityShares: formData.equityShares ? parseInt(formData.equityShares) : undefined,
      equityValue: formData.equityValue ? parseInt(formData.equityValue) : undefined,
      healthInsurance: formData.healthInsurance,
      dentalInsurance: formData.dentalInsurance,
      visionInsurance: formData.visionInsurance,
      retirement401k: formData.retirement401k,
      retirement401kMatch: formData.retirement401kMatch || undefined,
      paidTimeOff: formData.paidTimeOff ? parseInt(formData.paidTimeOff) : undefined,
      sickLeave: formData.sickLeave ? parseInt(formData.sickLeave) : undefined,
      parentalLeave: formData.parentalLeave ? parseInt(formData.parentalLeave) : undefined,
      startDate: formData.startDate || undefined,
      workLocation: formData.workLocation,
      workType: formData.workType,
      department: formData.department || undefined,
      reportingTo: formData.reportingTo || undefined,
      probationPeriod: formData.probationPeriod ? parseInt(formData.probationPeriod) : undefined,
      noticePeriod: formData.noticePeriod ? parseInt(formData.noticePeriod) : undefined,
      nonCompeteClause: formData.nonCompeteClause,
      nonCompeteDuration: formData.nonCompeteDuration ? parseInt(formData.nonCompeteDuration) : undefined,
      relocationAssistance: formData.relocationAssistance,
      relocationAmount: formData.relocationAmount ? parseInt(formData.relocationAmount) : undefined,
      recruiterNotes: formData.recruiterNotes || undefined,
      expiresAt: formData.expiresAt || undefined,
    });
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/offer-management")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Job Offer</h1>
          <p className="text-muted-foreground">
            Prepare a comprehensive offer for the candidate
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Position Details */}
          <Card>
            <CardHeader>
              <CardTitle>Position Details</CardTitle>
              <CardDescription>Basic information about the role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="offerTitle">Position Title *</Label>
                <Input
                  id="offerTitle"
                  value={formData.offerTitle}
                  onChange={(e) => updateField("offerTitle", e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => updateField("department", e.target.value)}
                    placeholder="e.g., Engineering"
                  />
                </div>

                <div>
                  <Label htmlFor="reportingTo">Reports To</Label>
                  <Input
                    id="reportingTo"
                    value={formData.reportingTo}
                    onChange={(e) => updateField("reportingTo", e.target.value)}
                    placeholder="e.g., VP of Engineering"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="workLocation">Work Location *</Label>
                  <Input
                    id="workLocation"
                    value={formData.workLocation}
                    onChange={(e) => updateField("workLocation", e.target.value)}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>

                <div>
                  <Label htmlFor="workType">Work Type</Label>
                  <Select value={formData.workType} onValueChange={(value) => updateField("workType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateField("startDate", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="expiresAt">Offer Expires</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => updateField("expiresAt", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compensation */}
          <Card>
            <CardHeader>
              <CardTitle>Compensation</CardTitle>
              <CardDescription>Salary and bonus structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="salaryType">Salary Type</Label>
                  <Select value={formData.salaryType} onValueChange={(value) => updateField("salaryType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="baseSalary">Base Salary * (USD)</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => updateField("baseSalary", e.target.value)}
                    placeholder="e.g., 120000"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="signOnBonus">Sign-on Bonus (USD)</Label>
                  <Input
                    id="signOnBonus"
                    type="number"
                    value={formData.signOnBonus}
                    onChange={(e) => updateField("signOnBonus", e.target.value)}
                    placeholder="e.g., 10000"
                  />
                </div>

                <div>
                  <Label htmlFor="performanceBonus">Performance Bonus (USD)</Label>
                  <Input
                    id="performanceBonus"
                    type="number"
                    value={formData.performanceBonus}
                    onChange={(e) => updateField("performanceBonus", e.target.value)}
                    placeholder="e.g., 15000"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="equityShares">Equity Shares</Label>
                  <Input
                    id="equityShares"
                    type="number"
                    value={formData.equityShares}
                    onChange={(e) => updateField("equityShares", e.target.value)}
                    placeholder="e.g., 1000"
                  />
                </div>

                <div>
                  <Label htmlFor="equityValue">Equity Value (USD)</Label>
                  <Input
                    id="equityValue"
                    type="number"
                    value={formData.equityValue}
                    onChange={(e) => updateField("equityValue", e.target.value)}
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Benefits</CardTitle>
              <CardDescription>Health, insurance, and time off benefits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="healthInsurance"
                    checked={formData.healthInsurance}
                    onCheckedChange={(checked) => updateField("healthInsurance", checked)}
                  />
                  <Label htmlFor="healthInsurance" className="cursor-pointer">
                    Health Insurance
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dentalInsurance"
                    checked={formData.dentalInsurance}
                    onCheckedChange={(checked) => updateField("dentalInsurance", checked)}
                  />
                  <Label htmlFor="dentalInsurance" className="cursor-pointer">
                    Dental Insurance
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visionInsurance"
                    checked={formData.visionInsurance}
                    onCheckedChange={(checked) => updateField("visionInsurance", checked)}
                  />
                  <Label htmlFor="visionInsurance" className="cursor-pointer">
                    Vision Insurance
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="retirement401k"
                    checked={formData.retirement401k}
                    onCheckedChange={(checked) => updateField("retirement401k", checked)}
                  />
                  <Label htmlFor="retirement401k" className="cursor-pointer">
                    401(k) Retirement Plan
                  </Label>
                </div>

                {formData.retirement401k && (
                  <div className="ml-6">
                    <Label htmlFor="retirement401kMatch">Employer Match</Label>
                    <Input
                      id="retirement401kMatch"
                      value={formData.retirement401kMatch}
                      onChange={(e) => updateField("retirement401kMatch", e.target.value)}
                      placeholder="e.g., 50% up to 6%"
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="paidTimeOff">PTO (days/year)</Label>
                  <Input
                    id="paidTimeOff"
                    type="number"
                    value={formData.paidTimeOff}
                    onChange={(e) => updateField("paidTimeOff", e.target.value)}
                    placeholder="e.g., 20"
                  />
                </div>

                <div>
                  <Label htmlFor="sickLeave">Sick Leave (days/year)</Label>
                  <Input
                    id="sickLeave"
                    type="number"
                    value={formData.sickLeave}
                    onChange={(e) => updateField("sickLeave", e.target.value)}
                    placeholder="e.g., 10"
                  />
                </div>

                <div>
                  <Label htmlFor="parentalLeave">Parental Leave (weeks)</Label>
                  <Input
                    id="parentalLeave"
                    type="number"
                    value={formData.parentalLeave}
                    onChange={(e) => updateField("parentalLeave", e.target.value)}
                    placeholder="e.g., 12"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="relocationAssistance"
                    checked={formData.relocationAssistance}
                    onCheckedChange={(checked) => updateField("relocationAssistance", checked)}
                  />
                  <Label htmlFor="relocationAssistance" className="cursor-pointer">
                    Relocation Assistance
                  </Label>
                </div>

                {formData.relocationAssistance && (
                  <div className="ml-6">
                    <Label htmlFor="relocationAmount">Relocation Amount (USD)</Label>
                    <Input
                      id="relocationAmount"
                      type="number"
                      value={formData.relocationAmount}
                      onChange={(e) => updateField("relocationAmount", e.target.value)}
                      placeholder="e.g., 5000"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
              <CardDescription>Employment terms and policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="probationPeriod">Probation Period (months)</Label>
                  <Input
                    id="probationPeriod"
                    type="number"
                    value={formData.probationPeriod}
                    onChange={(e) => updateField("probationPeriod", e.target.value)}
                    placeholder="e.g., 3"
                  />
                </div>

                <div>
                  <Label htmlFor="noticePeriod">Notice Period (months)</Label>
                  <Input
                    id="noticePeriod"
                    type="number"
                    value={formData.noticePeriod}
                    onChange={(e) => updateField("noticePeriod", e.target.value)}
                    placeholder="e.g., 2"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nonCompeteClause"
                    checked={formData.nonCompeteClause}
                    onCheckedChange={(checked) => updateField("nonCompeteClause", checked)}
                  />
                  <Label htmlFor="nonCompeteClause" className="cursor-pointer">
                    Non-Compete Clause
                  </Label>
                </div>

                {formData.nonCompeteClause && (
                  <div className="ml-6">
                    <Label htmlFor="nonCompeteDuration">Duration (months)</Label>
                    <Input
                      id="nonCompeteDuration"
                      type="number"
                      value={formData.nonCompeteDuration}
                      onChange={(e) => updateField("nonCompeteDuration", e.target.value)}
                      placeholder="e.g., 12"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>Internal notes about this offer</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.recruiterNotes}
                onChange={(e) => updateField("recruiterNotes", e.target.value)}
                placeholder="Add any additional context or notes about this offer..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Offer Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Compensation</div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                  }).format(
                    (parseInt(formData.baseSalary) || 0) +
                    (parseInt(formData.signOnBonus) || 0) +
                    (parseInt(formData.performanceBonus) || 0) +
                    (parseInt(formData.equityValue) || 0)
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Salary</span>
                  <span className="font-medium">
                    ${(parseInt(formData.baseSalary) || 0).toLocaleString()}
                  </span>
                </div>
                {formData.signOnBonus && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sign-on Bonus</span>
                    <span className="font-medium">
                      ${parseInt(formData.signOnBonus).toLocaleString()}
                    </span>
                  </div>
                )}
                {formData.performanceBonus && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Performance Bonus</span>
                    <span className="font-medium">
                      ${parseInt(formData.performanceBonus).toLocaleString()}
                    </span>
                  </div>
                )}
                {formData.equityValue && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equity Value</span>
                    <span className="font-medium">
                      ${parseInt(formData.equityValue).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => handleSubmit(false)}
              disabled={createOfferMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>

            <Button
              className="w-full"
              variant="outline"
              onClick={() => setLocation("/offer-management")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
