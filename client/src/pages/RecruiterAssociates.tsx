import { useState } from "react";
import RecruiterLayout from "@/components/RecruiterLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { 
  Search, 
  UserCheck, 
  Building2, 
  Calendar, 
  Mail, 
  Phone,
  MapPin,
  DollarSign,
  ArrowLeft,
  ExternalLink,
  Filter,
  Download,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RecruiterAssociates() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "onboarded" | "offered">("all");
  
  // Get all applications with offered status (placed candidates)
  const { data: placedCandidates, isLoading } = trpc.application.getPlaced.useQuery();
  
  // Filter candidates based on search and status
  const filteredCandidates = placedCandidates?.filter(app => {
    const matchesSearch = searchQuery === "" || 
      app.candidate?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidate?.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job?.companyName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "onboarded" && app.status === "onboarded") ||
      (statusFilter === "offered" && app.status === "offered");
    
    return matchesSearch && matchesStatus;
  }) || [];

  const stats = {
    total: placedCandidates?.length || 0,
    onboarded: placedCandidates?.filter(a => a.status === "onboarded").length || 0,
    offered: placedCandidates?.filter(a => a.status === "offered").length || 0,
  };

  return (
    <RecruiterLayout title="Associates">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-green-600" />
            Associates
          </h1>
          <p className="text-gray-500 mt-1">
            Candidates who have accepted offers and been onboarded
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Placed</p>
                    <p className="text-3xl font-bold text-green-700">{stats.total}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Onboarded</p>
                    <p className="text-3xl font-bold text-blue-700">{stats.onboarded}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Offer Accepted</p>
                    <p className="text-3xl font-bold text-purple-700">{stats.offered}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, job title, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="onboarded">Onboarded</SelectItem>
              <SelectItem value="offered">Offer Accepted</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Associates List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCandidates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Associates Found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== "all" 
                  ? "No candidates match your search criteria."
                  : "Candidates who accept offers and get onboarded will appear here."}
              </p>
              {(searchQuery || statusFilter !== "all") && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCandidates.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg">
                        {app.candidate?.user?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {app.candidate?.user?.name || "Unknown Candidate"}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {app.candidate?.user?.email}
                          </p>
                        </div>
                        <Badge 
                          className={
                            app.status === "onboarded" 
                              ? "bg-green-100 text-green-700 border-green-200" 
                              : "bg-purple-100 text-purple-700 border-purple-200"
                          }
                        >
                          {app.status === "onboarded" ? "Onboarded" : "Offer Accepted"}
                        </Badge>
                      </div>

                      {/* Job Details */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{app.job?.title}</span>
                          <span className="text-gray-400">at</span>
                          <span className="text-gray-700">{app.job?.companyName}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                          {app.job?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {app.job.location}
                            </span>
                          )}
                          {(app.job?.salaryMin || app.job?.salaryMax) && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              {app.job.salaryMin && app.job.salaryMax 
                                ? `$${(app.job.salaryMin / 1000).toFixed(0)}k - $${(app.job.salaryMax / 1000).toFixed(0)}k`
                                : app.job.salaryMin 
                                  ? `From $${(app.job.salaryMin / 1000).toFixed(0)}k`
                                  : `Up to $${(app.job.salaryMax! / 1000).toFixed(0)}k`
                              }
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Placed {app.updatedAt ? format(new Date(app.updatedAt), "MMM d, yyyy") : "Recently"}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/recruiter/candidates/${app.candidateId}`)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.href = `mailto:${app.candidate?.user?.email}`}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                        {app.candidate?.phoneNumber && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = `tel:${app.candidate?.phoneNumber}`}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
}
