import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { 
  SortableContext, 
  arrayMove, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, X, GripVertical, Save, Eye, ArrowLeft } from "lucide-react";

// Available fields for report building
const AVAILABLE_FIELDS = [
  { id: "candidateName", label: "Candidate Name", category: "Candidate" },
  { id: "candidateEmail", label: "Candidate Email", category: "Candidate" },
  { id: "candidatePhone", label: "Candidate Phone", category: "Candidate" },
  { id: "candidateLocation", label: "Candidate Location", category: "Candidate" },
  { id: "candidateSkills", label: "Skills", category: "Candidate" },
  { id: "candidateExperience", label: "Experience", category: "Candidate" },
  { id: "jobTitle", label: "Job Title", category: "Job" },
  { id: "jobLocation", label: "Job Location", category: "Job" },
  { id: "jobType", label: "Job Type", category: "Job" },
  { id: "jobSalary", label: "Salary Range", category: "Job" },
  { id: "recruiterName", label: "Recruiter Name", category: "Recruiter" },
  { id: "recruiterEmail", label: "Recruiter Email", category: "Recruiter" },
  { id: "applicationStatus", label: "Application Status", category: "Application" },
  { id: "applicationDate", label: "Application Date", category: "Application" },
  { id: "interviewDate", label: "Interview Date", category: "Interview" },
  { id: "interviewStatus", label: "Interview Status", category: "Interview" },
  { id: "interviewType", label: "Interview Type", category: "Interview" },
  { id: "feedbackRating", label: "Feedback Rating", category: "Feedback" },
  { id: "feedbackComments", label: "Feedback Comments", category: "Feedback" },
];

// Filter operators
const FILTER_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "between", label: "Between" },
];

interface Filter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface SortableFieldProps {
  field: { id: string; label: string; category: string };
  onRemove: () => void;
}

function SortableField({ field, onRemove }: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: field.id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-muted rounded-lg border"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="font-medium">{field.label}</div>
        <div className="text-xs text-muted-foreground">{field.category}</div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function CustomReportBuilder() {
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [selectedFields, setSelectedFields] = useState<typeof AVAILABLE_FIELDS>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [groupBy, setGroupBy] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const createReportMutation = trpc.companyAdmin.createCustomReport.useMutation({
    onSuccess: () => {
      toast.success("Custom report created successfully!");
      window.location.href = "/company-admin/custom-reports";
    },
    onError: (error) => {
      toast.error(`Failed to create report: ${error.message}`);
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedFields((fields) => {
        const oldIndex = fields.findIndex((f) => f.id === active.id);
        const newIndex = fields.findIndex((f) => f.id === over.id);
        return arrayMove(fields, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const addField = (fieldId: string) => {
    const field = AVAILABLE_FIELDS.find((f) => f.id === fieldId);
    if (field && !selectedFields.find((f) => f.id === fieldId)) {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const removeField = (fieldId: string) => {
    setSelectedFields(selectedFields.filter((f) => f.id !== fieldId));
  };

  const addFilter = () => {
    setFilters([
      ...filters,
      { id: crypto.randomUUID(), field: "", operator: "equals", value: "" },
    ]);
  };

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    setFilters(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const handleSave = () => {
    if (!reportName.trim()) {
      toast.error("Please enter a report name");
      return;
    }

    if (selectedFields.length === 0) {
      toast.error("Please select at least one field");
      return;
    }

    createReportMutation.mutate({
      name: reportName,
      description: reportDescription,
      selectedFields: selectedFields.map((f) => f.id),
      filters: filters.filter((f) => f.field && f.value),
      groupBy: groupBy || undefined,
      sortBy: sortBy || undefined,
      sortOrder,
    });
  };

  const activeField = activeId ? selectedFields.find((f) => f.id === activeId) : null;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6">
        <Link href="/company-admin/custom-reports">
          <Button
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Custom Report Builder</h1>
        <p className="text-muted-foreground mt-2">
          Create custom reports by selecting fields, adding filters, and configuring grouping options
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Report Information</CardTitle>
              <CardDescription>Enter basic details about your custom report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reportName">Report Name *</Label>
                <Input
                  id="reportName"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g., Monthly Recruitment Summary"
                />
              </div>
              <div>
                <Label htmlFor="reportDescription">Description</Label>
                <Textarea
                  id="reportDescription"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe what this report shows..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Selected Fields</CardTitle>
              <CardDescription>
                Drag to reorder fields. They will appear in this order in your report.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No fields selected. Add fields from the panel on the right.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedFields.map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedFields.map((field) => (
                        <SortableField
                          key={field.id}
                          field={field}
                          onRemove={() => removeField(field.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeField ? (
                      <div className="p-3 bg-muted rounded-lg border shadow-lg">
                        <div className="font-medium">{activeField.label}</div>
                        <div className="text-xs text-muted-foreground">{activeField.category}</div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Add conditions to filter your report data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filters.map((filter) => (
                <div key={filter.id} className="flex gap-2 items-start">
                  <Select
                    value={filter.field}
                    onValueChange={(value) => updateFilter(filter.id, { field: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_FIELDS.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter.operator}
                    onValueChange={(value) => updateFilter(filter.id, { operator: value })}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTER_OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    placeholder="Value"
                    className="flex-1"
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(filter.id)}
                    className="h-10 w-10 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" onClick={addFilter} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Filter
              </Button>
            </CardContent>
          </Card>

          {/* Grouping and Sorting */}
          <Card>
            <CardHeader>
              <CardTitle>Grouping & Sorting</CardTitle>
              <CardDescription>Configure how your report data is organized</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="groupBy">Group By</Label>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger id="groupBy">
                    <SelectValue placeholder="No grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No grouping</SelectItem>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sortBy">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger id="sortBy">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedFields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
                    <SelectTrigger id="sortOrder">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={createReportMutation.isPending} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {createReportMutation.isPending ? "Saving..." : "Save Report"}
            </Button>
            <Button variant="outline" disabled className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Preview (Coming Soon)
            </Button>
          </div>
        </div>

        {/* Right Panel - Available Fields */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Available Fields</CardTitle>
              <CardDescription>Click to add fields to your report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  AVAILABLE_FIELDS.reduce((acc, field) => {
                    if (!acc[field.category]) acc[field.category] = [];
                    acc[field.category].push(field);
                    return acc;
                  }, {} as Record<string, typeof AVAILABLE_FIELDS>)
                ).map(([category, fields]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-sm mb-2">{category}</h3>
                    <div className="space-y-1">
                      {fields.map((field) => {
                        const isSelected = selectedFields.some((f) => f.id === field.id);
                        return (
                          <Button
                            key={field.id}
                            variant={isSelected ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => addField(field.id)}
                            disabled={isSelected}
                            className="w-full justify-start"
                          >
                            {isSelected && <Badge variant="secondary" className="mr-2">✓</Badge>}
                            {field.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
