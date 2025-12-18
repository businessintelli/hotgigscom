import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home,
  Users,
  Activity,
  Mail,
  Video,
  TrendingUp,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Database,
  LayoutDashboard,
  Briefcase,
  FileText,
  Bell,
  BarChart3,
  Server,
  ScrollText,
  Linkedin,
  MessageSquare,
  Bot,
  DollarSign,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const sidebarItems = [
  { title: "Dashboard", href: "/admin/dashboard", icon: Home },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Reports", href: "/admin/reports", icon: BarChart3 },
  { title: "System Health", href: "/admin/health", icon: Activity },
  { title: "Analytics", href: "/admin/analytics", icon: TrendingUp },
  { title: "Environment", href: "/admin/environment", icon: Server },
  { title: "Logs", href: "/admin/logs", icon: ScrollText },
  { title: "Email Settings", href: "/admin/email-settings", icon: Mail },
  { title: "Video Settings", href: "/admin/video-settings", icon: Video },
  { title: "Email Delivery", href: "/admin/email-delivery", icon: TrendingUp },
  { title: "LinkedIn Settings", href: "/admin/linkedin-settings", icon: Linkedin },
  { title: "InMail Templates", href: "/admin/inmail-templates", icon: MessageSquare },
  { title: "LLM Settings", href: "/admin/llm-settings", icon: Bot },
  { title: "LLM Cost Tracking", href: "/admin/llm-cost-tracking", icon: DollarSign },
  { title: "LLM Alerts", href: "/admin/llm-alerts", icon: AlertTriangle },
  { title: "LLM Fallback", href: "/admin/llm-fallback", icon: RefreshCw },
  { title: "Database", href: "/admin/database", icon: Database },
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("admin-sidebar-collapsed", JSON.stringify(newState));
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  // Check if user is admin
  if (!loading && user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin dashboard.
          </p>
          <Button onClick={() => setLocation("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-slate-900 text-white transition-all duration-300 z-50 flex flex-col",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {!isCollapsed && (
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="font-bold text-lg">Admin Panel</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/admin/dashboard" className="mx-auto">
              <Shield className="h-8 w-8 text-blue-400" />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || location.startsWith(item.href + "/");
              
              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-slate-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="w-full justify-center text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-slate-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-800 transition-colors",
                  isCollapsed && "justify-center"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {user?.name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name || "Admin"}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/admin/dashboard')}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/admin/users')}>
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          isCollapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {title || "Admin Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm">
                View Site
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
