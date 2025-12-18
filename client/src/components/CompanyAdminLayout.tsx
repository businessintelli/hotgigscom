import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Users,
  Settings,
  MessageSquare,
  BarChart3,
  LogOut,
  Menu,
  X,
  Linkedin,
  User,
  ChevronDown,
  Sparkles,
  DollarSign,
  Bell,
  FileCheck
} from "lucide-react";
import { useState } from "react";

interface CompanyAdminLayoutProps {
  children: React.ReactNode;
}

export function CompanyAdminLayout({ children }: CompanyAdminLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    // Core
    { name: "Dashboard", href: "/company-admin/dashboard", icon: BarChart3 },
    { name: "Team Members", href: "/company-admin/team-members", icon: Users },
    { type: "divider", label: "Reports" },
    { name: "Reports", href: "/company-admin/reports", icon: BarChart3 },
    { name: "Custom Reports", href: "/company-admin/custom-reports", icon: BarChart3 },
    { name: "Report Schedules", href: "/company-admin/report-schedules", icon: BarChart3 },
    { type: "divider", label: "LinkedIn" },
    { name: "LinkedIn Settings", href: "/company-admin/linkedin-settings", icon: Linkedin },
    { name: "InMail Templates", href: "/company-admin/inmail-templates", icon: MessageSquare },
    { type: "divider", label: "AI Management" },
    { name: "AI Assistant", href: "/company-admin/ai-assistant", icon: Sparkles },
    { name: "AI Cost Tracking", href: "/company-admin/llm-cost-tracking", icon: DollarSign },
    { name: "AI Usage Alerts", href: "/company-admin/llm-alerts", icon: Bell },
    { type: "divider", label: "Analytics" },
    { name: "Analytics Dashboard", href: "/company-admin/analytics", icon: BarChart3 },
    { type: "divider", label: "Content Management" },
    { name: "Template Shares", href: "/company-admin/template-shares", icon: FileCheck },
    { type: "divider", label: "Settings" },
    { name: "Company Settings", href: "/company-admin/company-settings", icon: Settings },
  ];

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300 ${
          sidebarOpen ? (isCollapsed ? "w-20" : "w-64") : "-translate-x-full lg:translate-x-0"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            {!isCollapsed && (
              <Link href="/company-admin/dashboard">
                <a className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">HG</span>
                  </div>
                  <span className="font-bold text-lg">HotGigs</span>
                </a>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item, index) => {
              // Render divider with section label
              if (item.type === 'divider') {
                return (
                  <div key={`divider-${index}`} className="pt-4 pb-2">
                    {!isCollapsed && (
                      <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {item.label}
                      </h3>
                    )}
                    {isCollapsed && (
                      <div className="border-t border-border mx-2" />
                    )}
                  </div>
                );
              }
              
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    } ${
                      isCollapsed ? "justify-center" : ""
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && item.name}
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* User Profile with Dropdown */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Company Admin
                  </p>
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {!isCollapsed && "Profile"}
                  </span>
                  {!isCollapsed && <ChevronDown className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/company-admin/profile-settings'}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/company-admin/company-settings'}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Company Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        {!sidebarOpen && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Main content */}
      <main
        className={`transition-all duration-300 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Top header with profile icon */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">Company Admin</h2>
            </div>
            
            {/* Profile icon dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/company-admin/profile-settings'}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/company-admin/company-settings'}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Company Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {children}
      </main>
    </div>
  );
}
