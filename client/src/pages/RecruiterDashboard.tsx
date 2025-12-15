import { useAuth } from "@/_core/hooks/useAuth";
import { EmailVerificationGuard } from "@/components/EmailVerificationGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState, useCallback, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import RecruiterOnboarding from "@/components/RecruiterOnboarding";
import { NotificationBell } from "@/components/NotificationBell";
import { AIAssistantChat } from "@/components/AIAssistantChat";
import { formatDistanceToNow, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Video, 
  Building2, 
  FileText, 
  Calendar, 
  Search, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  Plus, 
  Filter, 
  Clock, 
  Shield,
  User,
  BarChart3,
  Mail,
  Upload,
  Target,
  RefreshCw,
  Sparkles,
  MapPin,
  DollarSign,
  Eye,
  CalendarDays,
  CheckSquare,
  Square,
  Copy,
  Archive,
  XCircle,
  MoreHorizontal,
  Command,
  Keyboard,
  GripVertical,
  MessageSquare,
  Bot
} from "lucide-react";

export default function RecruiterDashboard() {
  return (
    <EmailVerificationGuard>
      <RecruiterDashboardContent />
    </EmailVerificationGuard>
  );
}

// Sortable Job Item Component
interface SortableJobItemProps {
  job: any;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  isOwner: boolean;
  dragEnabled: boolean;
}

function SortableJobItem({ job, isSelected, onToggleSelect, onClick, isOwner, dragEnabled }: SortableJobItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id, disabled: !dragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer ${
        isSelected ? 'border-blue-400 bg-blue-50' : 'hover:border-blue-200'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      {dragEnabled && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
        onClick={(e) => e.stopPropagation()}
      />
      <div
        className="flex-1 min-w-0 flex items-center justify-between"
        onClick={onClick}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 truncate">{job.title}</h4>
            {isOwner && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                Mine
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {job.companyName && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {job.companyName}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
            {(job.salaryMin || job.salaryMax) && (
              <span className="flex items-center gap-1 hidden md:flex">
                <DollarSign className="h-3.5 w-3.5" />
                {job.salaryMin && job.salaryMax
                  ? `$${(job.salaryMin / 1000).toFixed(0)}k - $${(job.salaryMax / 1000).toFixed(0)}k`
                  : job.salaryMin
                    ? `From $${(job.salaryMin / 1000).toFixed(0)}k`
                    : `Up to $${(job.salaryMax / 1000).toFixed(0)}k`}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Posted {new Date(job.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <Badge
            variant="outline"
            className={`${
              job.status === 'active'
                ? 'bg-green-50 text-green-700 border-green-200'
                : job.status === 'closed'
                  ? 'bg-gray-50 text-gray-600 border-gray-200'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
            }`}
          >
            {job.status}
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Sidebar navigation items
// Types for sorting and templates
type JobSortOption = 'date_desc' | 'date_asc' | 'applications_desc' | 'applications_asc' | 'status_asc' | 'status_desc';

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/recruiter/dashboard", badge: null },
  { icon: Briefcase, label: "Jobs", path: "/recruiter/jobs", badge: null },
  { icon: Users, label: "Candidates", path: "/recruiter/search-candidates", badge: null },
  { icon: FileText, label: "Applications", path: "/recruiter/applications", badge: null },
  { icon: CalendarDays, label: "Calendar", path: null, badge: null, isCalendar: true },
  { icon: Calendar, label: "Interviews", path: "/recruiter/interviews", badge: null },
  { icon: Video, label: "AI Interviews", path: "/recruiter/interview-playback", badge: null },
  { icon: Target, label: "AI Matching", path: "/recruiter/ai-matching", badge: null },
  { icon: Bot, label: "AI Assistant", path: null, badge: null, isAIBot: true },
  { icon: Building2, label: "Clients", path: "/recruiter/customers", badge: null },
  { icon: Upload, label: "Bulk Upload", path: "/recruiter/bulk-upload", badge: null },
  { icon: Mail, label: "Email Campaigns", path: "/recruiter/campaigns", badge: null },
  { icon: BarChart3, label: "Analytics", path: "/analytics", badge: null },
  { icon: RefreshCw, label: "Reschedule Requests", path: "/recruiter/reschedule-requests", badge: "pending" },
];

function RecruiterDashboardContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { data: dashboardData, isLoading } = trpc.recruiter.getDashboardStats.useQuery();
  const { data: profile } = trpc.recruiter.getProfile.useQuery();
  const { data: completionStatus } = trpc.profileCompletion.getStatus.useQuery();
  const { data: pendingReschedules } = (trpc as any).reschedule?.getPendingRequests?.useQuery() || { data: [] };
  const { data: allJobs, refetch: refetchJobs } = trpc.job.getMyJobs.useQuery();
  const { data: interviews } = trpc.interview.getByRecruiter.useQuery();
  const { data: jobTemplates, refetch: refetchTemplates } = trpc.job.getTemplates.useQuery();
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Jobs panel state
  const [jobsFilter, setJobsFilter] = useState<"all" | "mine" | "others">("all");
  const [jobsSearch, setJobsSearch] = useState("");
  const [jobsStatus, setJobsStatus] = useState<"all" | "active" | "closed" | "draft">("all");
  const [jobsDateFilter, setJobsDateFilter] = useState<"all" | "7days" | "30days" | "90days">("all");
  
  // Bulk selection state
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState<{ open: boolean; action: string }>({ open: false, action: "" });
  
  // Search dialog state for keyboard shortcut
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Sorting state
  const [jobSortBy, setJobSortBy] = useState<JobSortOption>('date_desc');
  
  // Job templates state
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  
  // Export state
  const [exporting, setExporting] = useState(false);
  
  // AI Bot state
  const [showAIBot, setShowAIBot] = useState(false);
  
  // Drag and drop state for job reordering
  const [jobOrder, setJobOrder] = useState<number[]>([]);
  const [dragEnabled, setDragEnabled] = useState(false);
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Bulk action mutations
  const bulkCloseMutation = trpc.job.bulkClose.useMutation();
  const bulkArchiveMutation = trpc.job.bulkArchive.useMutation();
  const duplicateJobMutation = trpc.job.duplicate.useMutation();

  useEffect(() => {
    const hasToken = localStorage.getItem('auth_token');
    if (!authLoading && !hasToken && !user) {
      setLocation('/');
    } else if (!authLoading && user && user.role !== 'recruiter') {
      setLocation('/');
    }
  }, [authLoading, user, setLocation]);

  useEffect(() => {
    if (profile && !profile.companyName) {
      setShowOnboarding(true);
    }
  }, [profile]);

  // Keyboard shortcuts handler - must be before early returns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchDialogOpen(true);
      }
      // Cmd/Ctrl + N for new job
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setLocation('/recruiter/jobs/create');
      }
      // Escape to close search dialog
      if (e.key === 'Escape' && searchDialogOpen) {
        setSearchDialogOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchDialogOpen, setLocation]);
  
  // Focus search input when dialog opens
  useEffect(() => {
    if (searchDialogOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchDialogOpen]);
  
  // Initialize job order for drag and drop - must be before early return
  useEffect(() => {
    if (allJobs && allJobs.length > 0 && jobOrder.length === 0) {
      setJobOrder(allJobs.map((job: any) => job.id));
    }
  }, [allJobs, jobOrder.length]);
  
  // Toggle job selection
  const toggleJobSelection = (jobId: number) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };
  
  // Select all filtered jobs
  const selectAllJobs = () => {
    const allIds = filteredJobs.map((job: any) => job.id);
    if (selectedJobs.size === allIds.length) {
      setSelectedJobs(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedJobs(new Set(allIds));
      setShowBulkActions(true);
    }
  };
  
  // Clear selection
  const clearSelection = () => {
    setSelectedJobs(new Set());
    setShowBulkActions(false);
  };
  
  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    const jobIds = Array.from(selectedJobs);
    setBulkActionDialog({ open: false, action: "" });
    
    try {
      if (action === 'close') {
        await bulkCloseMutation.mutateAsync({ jobIds });
        toast.success(`${jobIds.length} jobs marked as closed`);
      } else if (action === 'archive') {
        await bulkArchiveMutation.mutateAsync({ jobIds });
        toast.success(`${jobIds.length} jobs archived`);
      } else if (action === 'duplicate') {
        const result = await duplicateJobMutation.mutateAsync({ jobIds });
        toast.success(`${result.createdIds.length} jobs duplicated`);
      }
      clearSelection();
      // Refetch jobs
      refetchJobs?.();
    } catch (error) {
      toast.error('Failed to perform bulk action');
    }
  };

  // Early return for loading state - after all hooks
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">HG</span>
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    activeJobs: 0,
    totalApplications: 0,
    aiMatches: 0,
    submittedToClients: 0,
  };

  const recentJobs = dashboardData?.recentJobs || [];
  const pendingCount = pendingReschedules?.filter((r: any) => r.status === 'pending').length || 0;
  const profilePercentage = completionStatus?.percentage || 0;

  // Filter jobs
  const filteredJobs = (allJobs || []).filter((job: any) => {
    // Filter by ownership
    if (jobsFilter === "mine" && job.recruiterId !== user?.id) return false;
    if (jobsFilter === "others" && job.recruiterId === user?.id) return false;
    
    // Filter by status
    if (jobsStatus !== "all" && job.status !== jobsStatus) return false;
    
    // Filter by date
    if (jobsDateFilter !== "all") {
      const jobDate = new Date(job.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (jobsDateFilter === "7days" && daysDiff > 7) return false;
      if (jobsDateFilter === "30days" && daysDiff > 30) return false;
      if (jobsDateFilter === "90days" && daysDiff > 90) return false;
    }
    
    // Filter by search
    if (jobsSearch) {
      const search = jobsSearch.toLowerCase();
      return (
        job.title?.toLowerCase().includes(search) ||
        job.location?.toLowerCase().includes(search) ||
        job.companyName?.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  // Sort filtered jobs
  const sortedJobs = [...filteredJobs].sort((a: any, b: any) => {
    switch (jobSortBy) {
      case 'date_desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'date_asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'applications_desc':
        return (b.applicationCount || 0) - (a.applicationCount || 0);
      case 'applications_asc':
        return (a.applicationCount || 0) - (b.applicationCount || 0);
      case 'status_asc':
        return (a.status || '').localeCompare(b.status || '');
      case 'status_desc':
        return (b.status || '').localeCompare(a.status || '');
      default:
        return 0;
    }
  });

  // Calendar helpers
  const calendarDays = eachDayOfInterval({
    start: startOfMonth(calendarDate),
    end: endOfMonth(calendarDate)
  });

  const interviewsByDate: Record<string, any[]> = {};
  (interviews || []).forEach((interview: any) => {
    if (!interview.scheduledAt) return;
    const date = new Date(interview.scheduledAt);
    if (isNaN(date.getTime())) return; // Skip invalid dates
    const dateKey = format(date, 'yyyy-MM-dd');
    if (!interviewsByDate[dateKey]) interviewsByDate[dateKey] = [];
    interviewsByDate[dateKey].push(interview);
  });

  // Export jobs to CSV
  const exportJobsToCSV = () => {
    setExporting(true);
    try {
      const jobsToExport = selectedJobs.size > 0 
        ? sortedJobs.filter((job: any) => selectedJobs.has(job.id))
        : sortedJobs;
      
      const headers = ['Title', 'Company', 'Location', 'Status', 'Salary Min', 'Salary Max', 'Created Date', 'Applications'];
      const rows = jobsToExport.map((job: any) => [
        job.title || '',
        job.companyName || '',
        job.location || '',
        job.status || '',
        job.salaryMin || '',
        job.salaryMax || '',
        job.createdAt ? format(new Date(job.createdAt), 'yyyy-MM-dd') : '',
        job.applicationCount || 0
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `jobs_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      
      toast.success(`Exported ${jobsToExport.length} jobs to CSV`);
    } catch (error) {
      toast.error('Failed to export jobs');
    } finally {
      setExporting(false);
    }
  };

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = jobOrder.indexOf(Number(active.id));
      const newIndex = jobOrder.indexOf(Number(over.id));
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(jobOrder, oldIndex, newIndex);
        setJobOrder(newOrder);
        toast.success('Job order updated');
      }
    }
  };

 // Get ordered jobs based on drag order or sorted order
  const orderedJobs = dragEnabled && jobOrder.length > 0
    ? jobOrder.map(id => sortedJobs.find((job: any) => job.id === id)).filter(Boolean)
    : sortedJobs;

  const statCards = [
    { title: 'Active Jobs', value: stats.activeJobs, change: '+2 this week', icon: Briefcase, color: 'bg-blue-500', link: '/recruiter/jobs' },
    { title: 'Total Applications', value: stats.totalApplications, change: '+23 this week', icon: FileText, color: 'bg-green-500', link: '/recruiter/applications' },
    { title: 'AI Matches', value: stats.aiMatches, change: '+15 this week', icon: Sparkles, color: 'bg-purple-500', link: '/recruiter/ai-matching' },
    { title: 'Submitted to Clients', value: stats.submittedToClients, change: '+8 this week', icon: Building2, color: 'bg-orange-500', link: '/recruiter/submissions' },
  ];

  // Session info for profile dropdown
  const sessionExpiry = (user as any)?.sessionExpiry ? new Date((user as any).sessionExpiry) : null;
  const rememberMe = (user as any)?.rememberMe;

  return (
    <>
      <RecruiterOnboarding 
        open={showOnboarding} 
        onComplete={() => setShowOnboarding(false)} 
      />
      
      <div className="min-h-screen bg-gray-50 flex">
        {/* Desktop Sidebar */}
        <aside 
          className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HG</span>
                </div>
                <span className="font-bold text-gray-900">HotGigs</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Sidebar Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-2">
              {sidebarItems.map((item) => {
                const isActive = item.path ? (location === item.path || (item.path !== '/recruiter/dashboard' && location.startsWith(item.path))) : false;
                const badgeCount = item.badge === "pending" ? pendingCount : null;
                
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          if ((item as any).isCalendar) {
                            setShowCalendar(true);
                          } else if ((item as any).isAIBot) {
                            setShowAIBot(true);
                          } else if (item.path) {
                            setLocation(item.path);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : ''}`} />
                        {!sidebarCollapsed && (
                          <span className="text-sm font-medium">{item.label}</span>
                        )}
                        {badgeCount && badgeCount > 0 && (
                          <Badge 
                            className={`${sidebarCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full`}
                          >
                            {badgeCount}
                          </Badge>
                        )}
                      </button>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right">
                        {item.label}
                        {badgeCount && badgeCount > 0 && ` (${badgeCount})`}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Sidebar Footer - Quick Actions */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-gray-200">
              <Button 
                onClick={() => setLocation('/recruiter/jobs/create')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">HG</span>
                      </div>
                      HotGigs
                    </SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="flex-1 py-4">
                    <nav className="space-y-1 px-2">
                      {sidebarItems.map((item) => {
                        const isActive = item.path ? location === item.path : false;
                        const badgeCount = item.badge === "pending" ? pendingCount : null;
                        
                        return (
                          <button
                            key={item.label}
                            onClick={() => {
                              if ((item as any).isCalendar) {
                                setShowCalendar(true);
                              } else if ((item as any).isAIBot) {
                                setShowAIBot(true);
                              } else if (item.path) {
                                setLocation(item.path);
                              }
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                              isActive 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : ''}`} />
                            <span className="text-sm font-medium">{item.label}</span>
                            {badgeCount && badgeCount > 0 && (
                              <Badge className="ml-auto bg-red-500 text-white text-xs">
                                {badgeCount}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </nav>
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <Button 
                      onClick={() => {
                        setLocation('/recruiter/jobs/create');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Job
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">Dashboard</h1>
            </div>

            {/* Right Side - Notifications & Profile */}
            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationBell />
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors">
                    <Avatar className="h-8 w-8 border-2 border-blue-200">
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium">
                        {user?.name?.charAt(0).toUpperCase() || 'R'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">Recruiter</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {/* Profile Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-blue-200">
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-medium">
                          {user?.name?.charAt(0).toUpperCase() || 'R'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">Recruiter</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Profile Completion */}
                  {profilePercentage < 100 && (
                    <div className="p-4 border-b bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">Profile Completion</span>
                        <span className="text-sm font-bold text-blue-600">{profilePercentage}%</span>
                      </div>
                      <Progress value={profilePercentage} className="h-2" />
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="mt-2 p-0 h-auto text-blue-600"
                        onClick={() => setLocation('/recruiter/onboarding')}
                      >
                        Complete Profile →
                      </Button>
                    </div>
                  )}

                  {/* Session Info */}
                  {sessionExpiry && (
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div className="text-xs text-gray-600">
                          {rememberMe ? (
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              <span>Staying signed in • Expires {formatDistanceToNow(sessionExpiry, { addSuffix: true })}</span>
                            </div>
                          ) : (
                            <span>Session expires {formatDistanceToNow(sessionExpiry, { addSuffix: true })}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider">Account</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setLocation('/recruiter/onboarding')} className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/recruiter/notification-preferences')} className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
              <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
              <p className="opacity-90">Here's what's happening with your recruitment activities today.</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statCards.map((stat, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
                  onClick={() => setLocation(stat.link)}
                >
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-xl lg:text-2xl font-bold mt-1">{stat.value}</p>
                        <p className="text-xs text-green-600 mt-1 hidden sm:block">{stat.change}</p>
                      </div>
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                        <stat.icon className="h-5 w-5 lg:h-6 lg:w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Jobs Panel */}
            <Card className="mb-6">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      Jobs
                    </CardTitle>
                    <CardDescription>Manage and track all job postings</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setLocation('/recruiter/jobs/create')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Job
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters Row 1 */}
                <div className="flex flex-col sm:flex-row gap-3 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search jobs... (⌘K)"
                      value={jobsSearch}
                      onChange={(e) => setJobsSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={jobsFilter} onValueChange={(v: any) => setJobsFilter(v)}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      <SelectItem value="mine">My Jobs</SelectItem>
                      <SelectItem value="others">Team Jobs</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={jobsStatus} onValueChange={(v: any) => setJobsStatus(v)}>
                    <SelectTrigger className="w-full sm:w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={jobsDateFilter} onValueChange={(v: any) => setJobsDateFilter(v)}>
                    <SelectTrigger className="w-full sm:w-40">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={jobSortBy} onValueChange={(v: any) => setJobSortBy(v)}>
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Newest First</SelectItem>
                      <SelectItem value="date_asc">Oldest First</SelectItem>
                      <SelectItem value="applications_desc">Most Applications</SelectItem>
                      <SelectItem value="applications_asc">Least Applications</SelectItem>
                      <SelectItem value="status_asc">Status A-Z</SelectItem>
                      <SelectItem value="status_desc">Status Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportJobsToCSV}
                    disabled={exporting}
                    className="hidden sm:flex"
                  >
                    {exporting ? (
                      <><span className="animate-spin mr-2">⏳</span> Exporting...</>
                    ) : (
                      <><FileText className="h-4 w-4 mr-2" /> Export CSV</>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowTemplates(true)}
                    className="hidden sm:flex"
                  >
                    <Copy className="h-4 w-4 mr-2" /> Templates
                  </Button>
                </div>
                
                {/* Bulk Actions Bar */}
                {showBulkActions && (
                  <div className="flex items-center gap-3 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm font-medium text-blue-700">
                      {selectedJobs.size} job{selectedJobs.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex-1" />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setBulkActionDialog({ open: true, action: 'close' })}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Close
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setBulkActionDialog({ open: true, action: 'archive' })}
                      className="text-gray-600 border-gray-200 hover:bg-gray-50"
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      Archive
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setBulkActionDialog({ open: true, action: 'duplicate' })}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                )}
                
                {/* Select All / Keyboard Hints */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={filteredJobs.length > 0 && selectedJobs.size === filteredJobs.length}
                      onCheckedChange={selectAllJobs}
                    />
                    <span className="text-sm text-gray-500">
                      {filteredJobs.length > 0 && selectedJobs.size === filteredJobs.length 
                        ? 'Deselect all' 
                        : `Select all (${filteredJobs.length})`
                      }
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-4">
                    <Button
                      variant={dragEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setDragEnabled(!dragEnabled);
                        if (!dragEnabled) {
                          setJobOrder(sortedJobs.map((job: any) => job.id));
                        }
                      }}
                      className="h-7 text-xs"
                    >
                      <GripVertical className="h-3 w-3 mr-1" />
                      {dragEnabled ? 'Done Reordering' : 'Reorder'}
                    </Button>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-xs">⌘K</kbd>
                        Search
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-xs">⌘N</kbd>
                        New Job
                      </span>
                    </div>
                  </div>
                </div>

                {/* Jobs List */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={orderedJobs.map((job: any) => job.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {orderedJobs.length > 0 ? orderedJobs.slice(0, 10).map((job: any) => (
                        <SortableJobItem
                          key={job.id}
                          job={job}
                          isSelected={selectedJobs.has(job.id)}
                          onToggleSelect={() => toggleJobSelection(job.id)}
                          onClick={() => setLocation(`/jobs/${job.id}`)}
                          isOwner={job.recruiterId === user?.id}
                          dragEnabled={dragEnabled}
                        />
                      )) : (
                        <div className="text-center py-8 text-gray-500">
                          <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-20" />
                          <p>No jobs found matching your criteria</p>
                          <Button 
                            variant="link" 
                            onClick={() => {
                              setJobsFilter("all");
                              setJobsStatus("all");
                              setJobsSearch("");
                              setJobsDateFilter("all");
                            }}
                          >
                            Clear filters
                          </Button>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>

                {filteredJobs.length > 10 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={() => setLocation('/recruiter/jobs')}>
                      View All {filteredJobs.length} Jobs
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Streamline your recruitment workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <Button 
                    onClick={() => setLocation('/recruiter/advanced-search')} 
                    className="h-20 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white flex-col gap-1"
                  >
                    <Search className="h-5 w-5" />
                    <span className="text-xs">Advanced Search</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/recruiter/ai-matching')} 
                    className="h-20 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-col gap-1"
                  >
                    <Target className="h-5 w-5" />
                    <span className="text-xs">AI Matching</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/recruiter/interview-calendar')} 
                    className="h-20 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white flex-col gap-1"
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs">Calendar View</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/recruiter/resume-ranking')} 
                    className="h-20 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white flex-col gap-1"
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-xs">Resume Ranking</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/recruiter/bulk-upload')} 
                    className="h-20 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white flex-col gap-1"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">Bulk Upload</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/recruiter/email-templates')} 
                    className="h-20 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white flex-col gap-1"
                  >
                    <Mail className="h-5 w-5" />
                    <span className="text-xs">Email Templates</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/recruiter/pipeline')} 
                    className="h-20 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white flex-col gap-1"
                  >
                    <Users className="h-5 w-5" />
                    <span className="text-xs">Pipeline View</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/analytics')} 
                    className="h-20 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white flex-col gap-1"
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-xs">Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      
      {/* Search Dialog (Cmd+K) */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Search
            </DialogTitle>
            <DialogDescription>
              Search for jobs, candidates, or navigate to any page
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              ref={searchInputRef}
              placeholder="Type to search..."
              value={jobsSearch}
              onChange={(e) => setJobsSearch(e.target.value)}
              className="text-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchDialogOpen(false);
                }
              }}
            />
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => {
                    setSearchDialogOpen(false);
                    setLocation('/recruiter/jobs/create');
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Job
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => {
                    setSearchDialogOpen(false);
                    setLocation('/recruiter/search-candidates');
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Search Candidates
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => {
                    setSearchDialogOpen(false);
                    setLocation('/recruiter/applications');
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Applications
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => {
                    setSearchDialogOpen(false);
                    setLocation('/recruiter/interviews');
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View Interviews
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="text-xs text-gray-400">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border mx-1">Enter</kbd> to search or <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border mx-1">Esc</kbd> to close
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={bulkActionDialog.open} onOpenChange={(open) => setBulkActionDialog({ ...bulkActionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkActionDialog.action === 'close' && 'Close Selected Jobs'}
              {bulkActionDialog.action === 'archive' && 'Archive Selected Jobs'}
              {bulkActionDialog.action === 'duplicate' && 'Duplicate Selected Jobs'}
            </DialogTitle>
            <DialogDescription>
              {bulkActionDialog.action === 'close' && `Are you sure you want to close ${selectedJobs.size} job(s)? This will mark them as closed and they will no longer accept applications.`}
              {bulkActionDialog.action === 'archive' && `Are you sure you want to archive ${selectedJobs.size} job(s)? Archived jobs will be hidden from the main view.`}
              {bulkActionDialog.action === 'duplicate' && `This will create ${selectedJobs.size} new job(s) as copies of the selected jobs.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog({ open: false, action: '' })}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleBulkAction(bulkActionDialog.action)}
              className={`${
                bulkActionDialog.action === 'close' ? 'bg-orange-600 hover:bg-orange-700' :
                bulkActionDialog.action === 'archive' ? 'bg-gray-600 hover:bg-gray-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {bulkActionDialog.action === 'close' && 'Close Jobs'}
              {bulkActionDialog.action === 'archive' && 'Archive Jobs'}
              {bulkActionDialog.action === 'duplicate' && 'Duplicate Jobs'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Dialog */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Interview Calendar
            </DialogTitle>
            <DialogDescription>View and manage your scheduled interviews</DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="sm" onClick={() => setCalendarDate(subMonths(calendarDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {format(calendarDate, 'MMMM yyyy')}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setCalendarDate(addMonths(calendarDate, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for days before the first of the month */}
              {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 bg-gray-50 rounded-lg" />
              ))}
              
              {calendarDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayInterviews = interviewsByDate[dateKey] || [];
                const hasInterviews = dayInterviews.length > 0;
                
                return (
                  <div
                    key={dateKey}
                    className={`h-20 p-1 border rounded-lg ${
                      isToday(day) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    } ${!isSameMonth(day, calendarDate) ? 'opacity-50' : ''}`}
                  >
                    <div className={`text-sm font-medium ${isToday(day) ? 'text-blue-600' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </div>
                    {hasInterviews && (
                      <div className="mt-1 space-y-1">
                        {dayInterviews.slice(0, 2).map((interview: any) => (
                          <div
                            key={interview.id}
                            className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-purple-200"
                            title={interview.candidate?.fullName || 'Interview'}
                            onClick={() => setLocation(`/recruiter/interviews/${interview.id}`)}
                          >
                            {format(new Date(interview.scheduledAt), 'h:mm a')}
                          </div>
                        ))}
                        {dayInterviews.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayInterviews.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Job Templates
            </DialogTitle>
            <DialogDescription>Create jobs from templates or save current jobs as templates</DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            {/* Existing Templates */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Available Templates</h4>
              {jobTemplates && jobTemplates.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {jobTemplates.map((template: any) => (
                    <div 
                      key={template.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-gray-500">{template.title} • {template.location}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setShowTemplates(false);
                            setLocation(`/recruiter/jobs/create?templateId=${template.id}`);
                          }}
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Copy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No templates yet</p>
                  <p className="text-sm">Save a job as a template to reuse it later</p>
                </div>
              )}
            </div>

            {/* Quick Create from Selected */}
            {selectedJobs.size > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Save Selected as Template</h4>
                <p className="text-sm text-gray-500 mb-3">
                  Save the selected job(s) as reusable templates
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  onClick={() => {
                    toast.info('Template saving feature coming soon');
                  }}
                >
                  Save {selectedJobs.size} Job(s) as Template
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Dialog */}
      <Dialog open={showAIBot} onOpenChange={setShowAIBot}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              AI Recruiting Assistant
            </DialogTitle>
            <DialogDescription>
              Get help with job descriptions, candidate screening, and recruitment strategies
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <AIAssistantChat
              systemPrompt={`You are an AI Recruiting Assistant for HotGigs. You help recruiters with:
- Writing compelling job descriptions
- Screening candidate profiles and resumes
- Interview question suggestions
- Recruitment strategy advice
- Salary benchmarking insights
- Diversity and inclusion best practices
- Employer branding tips

The recruiter is from ${profile?.companyName || 'a company'}.
They currently have ${dashboardData?.stats?.activeJobs || 0} active job postings.
They have received ${dashboardData?.stats?.totalApplications || 0} total applications.

Be professional, data-driven, and provide actionable advice. Focus on efficiency and quality of hire.`}
              placeholder="Ask me about job descriptions, candidates, or recruitment strategies..."
              suggestedPrompts={[
                "Write a job description for a Senior Developer",
                "What interview questions should I ask?",
                "How can I improve my employer brand?",
                "Tips for reducing time-to-hire"
              ]}
            />
          </div>
        </DialogContent>
      </Dialog>


    </>
  );
}
