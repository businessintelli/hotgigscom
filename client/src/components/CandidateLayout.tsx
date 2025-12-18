import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { 
  LayoutDashboard, 
  FileText, 
  Video, 
  Search, 
  Briefcase, 
  Heart, 
  CalendarDays, 
  Users, 
  MessageSquare, 
  Star, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  Settings,
  Bell
} from "lucide-react";
import { useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { NotificationBell } from "@/components/NotificationBell";

// Sidebar navigation items for candidates with grouped sections
const sidebarItems = [
  // Core
  { icon: LayoutDashboard, label: "Dashboard", path: "/candidate-dashboard" },
  { icon: Search, label: "Browse Jobs", path: "/jobs" },
  { icon: Briefcase, label: "My Applications", path: "/my-applications" },
  { icon: Heart, label: "Saved Jobs", path: "/saved-jobs" },
  { type: "divider", label: "Profile" },
  { icon: FileText, label: "My Resume", path: "/candidate/my-resumes" },
  { icon: Video, label: "Video Introduction", path: "/candidate/video-intro" },
  { type: "divider", label: "AI Tools" },
  { icon: MessageSquare, label: "AI Career Coach", path: "/candidate/career-coach" },
  { icon: Star, label: "Recommendations", path: "/recommendations" },
  { type: "divider", label: "Resources" },
  { icon: CalendarDays, label: "Calendar", path: "/candidate/calendar" },
  { icon: BookOpen, label: "Career Resources", path: "/resources" },
];

interface CandidateLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function CandidateLayout({ children, title, showBackButton, onBack }: CandidateLayoutProps) {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">HotGigs</h1>
            <p className="text-sm text-gray-500">Please sign in to continue</p>
          </div>
          <Button onClick={() => window.location.href = getLoginUrl()} size="lg" className="w-full">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  const renderSidebarContent = (isMobile = false) => (
    <nav className="space-y-1 px-2">
      {sidebarItems.map((item, index) => {
        // Render divider with section label
        if (item.type === 'divider') {
          return (
            <div key={`divider-${index}`} className="pt-4 pb-2">
              {(!sidebarCollapsed || isMobile) && (
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {item.label}
                </h3>
              )}
              {(sidebarCollapsed && !isMobile) && (
                <div className="border-t border-gray-200 mx-2" />
              )}
            </div>
          );
        }
        
        const isActive = item.path === location || (item.path !== '/candidate-dashboard' && location.startsWith(item.path));
        
        return (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  setLocation(item.path);
                  if (isMobile) setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-emerald-600' : ''}`} />
                {(!sidebarCollapsed || isMobile) && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            </TooltipTrigger>
            {sidebarCollapsed && !isMobile && (
              <TooltipContent side="right">
                {item.label}
              </TooltipContent>
            )}
          </Tooltip>
        );
      })}
    </nav>
  );

  return (
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
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
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
          {renderSidebarContent()}
        </ScrollArea>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <Button 
              onClick={() => setLocation('/jobs')}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <Search className="h-4 w-4 mr-2" />
              Find Jobs
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
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">HG</span>
                    </div>
                    HotGigs
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 py-4">
                  {renderSidebarContent(true)}
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Page Title */}
            {title && (
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">{title}</h1>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">{user.name || user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/candidate-dashboard')}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/candidate/my-resumes')}>
                  <FileText className="h-4 w-4 mr-2" />
                  My Resume
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
