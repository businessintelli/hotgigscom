import { useState, useMemo } from "react";
import RecruiterLayout from "@/components/RecruiterLayout";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Briefcase, Mail, Phone, FileText, SlidersHorizontal, X, Save, Bookmark, Bell, Trash2, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useLocation } from "wouter";
import AddCandidateDialog from "@/components/AddCandidateDialog";

export default function CandidateSearch() {
  const [, navigate] = useLocation();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("all");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [alertFrequency, setAlertFrequency] = useState<"immediate" | "daily" | "weekly">("daily");
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const debouncedKeyword = useDebounce(keyword, 300);
  const debouncedLocation = useDebounce(location, 300);
  
  const searchParams = useMemo(() => ({
    keyword: debouncedKeyword || undefined,
    location: debouncedLocation || undefined,
    experienceLevel: experienceLevel !== "all" ? experienceLevel : undefined,
  }), [debouncedKeyword, debouncedLocation, experienceLevel]);
  
  const { data: results = [], isLoading } = trpc.recruiter.searchCandidates.useQuery(searchParams);
  const { data: savedSearches = [] } = trpc.recruiter.getSavedSearches.useQuery();
  const saveSearchMutation = trpc.recruiter.saveSearch.useMutation({
    onSuccess: () => {
      toast({ title: "Search saved successfully", description: "You can access it from your saved searches." });
      setSaveDialogOpen(false);
      setSearchName("");
      utils.recruiter.getSavedSearches.invalidate();
    },
    onError: (error) => {
      toast({ title: "Failed to save search", description: error.message, variant: "destructive" });
    },
  });
  const deleteSavedSearchMutation = trpc.recruiter.deleteSavedSearch.useMutation({
    onSuccess: () => {
      toast({ title: "Search deleted", description: "Saved search has been removed." });
      utils.recruiter.getSavedSearches.invalidate();
    },
  });
  
  const activeFilterCount = [
    debouncedKeyword,
    debouncedLocation,
    experienceLevel !== "all",
  ].filter(Boolean).length;
  
  const clearAllFilters = () => {
    setKeyword("");
    setLocation("");
    setExperienceLevel("all");
  };
  
  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast({ title: "Search name required", description: "Please enter a name for this search.", variant: "destructive" });
      return;
    }
    saveSearchMutation.mutate({
      name: searchName,
      keyword: keyword || undefined,
      location: location || undefined,
      experienceLevel: experienceLevel !== "all" ? experienceLevel : undefined,
      emailAlerts,
      alertFrequency,
    });
  };
  
  const loadSavedSearch = (search: any) => {
    setKeyword(search.keyword || "");
    setLocation(search.location || "");
    setExperienceLevel(search.experienceLevel || "all");
    setShowSavedSearches(false);
    toast({ title: "Search loaded", description: `Loaded "${search.name}"` });
  };
  
  return (
    <RecruiterLayout title="Candidates">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto py-8">
        <Button 
          onClick={() => navigate('/recruiter/dashboard')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Candidate Search</h1>
            <p className="text-slate-600">Find the perfect candidates for your open positions</p>
          </div>
          <div className="flex gap-2">
            <AddCandidateDialog onSuccess={() => utils.recruiter.searchCandidates.invalidate()} />
            <Button
              variant="outline"
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              className="flex items-center gap-2"
            >
              <Bookmark className="h-4 w-4" />
              Saved Searches
              {savedSearches.length > 0 && (
                <Badge variant="secondary" className="ml-1">{savedSearches.length}</Badge>
              )}
            </Button>
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Search
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Search</DialogTitle>
                  <DialogDescription>
                    Save your current search criteria for quick access later
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchName">Search Name</Label>
                    <Input
                      id="searchName"
                      placeholder="e.g., Senior Python Developers in SF"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailAlerts">Email Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new candidates match
                      </p>
                    </div>
                    <Switch
                      id="emailAlerts"
                      checked={emailAlerts}
                      onCheckedChange={setEmailAlerts}
                    />
                  </div>
                  {emailAlerts && (
                    <div className="space-y-2">
                      <Label htmlFor="alertFrequency">Alert Frequency</Label>
                      <Select value={alertFrequency} onValueChange={(v: any) => setAlertFrequency(v)}>
                        <SelectTrigger id="alertFrequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Digest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSearch} disabled={saveSearchMutation.isPending}>
                    {saveSearchMutation.isPending ? "Saving..." : "Save Search"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Saved Searches Panel */}
        {showSavedSearches && savedSearches.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Your Saved Searches
              </CardTitle>
              <CardDescription>Click to load a saved search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {savedSearches.map((search: any) => (
                  <Card key={search.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => loadSavedSearch(search)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{search.name}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mt-1 -mr-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedSearchMutation.mutate({ id: search.id });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {search.keyword && <div>Keywords: {search.keyword}</div>}
                        {search.location && <div>Location: {search.location}</div>}
                        {search.experienceLevel && <div>Level: {search.experienceLevel}</div>}
                        {search.emailAlerts && (
                          <div className="flex items-center gap-1 text-green-600 mt-2">
                            <Bell className="h-3 w-3" />
                            {search.alertFrequency} alerts
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5" />
                    <CardTitle>Filters</CardTitle>
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary">{activeFilterCount}</Badge>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-8 px-2"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Keyword Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Keyword</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Skills, title..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                {/* Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="City, state, or country"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                {/* Experience Level */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Experience Level
                  </label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                      <SelectItem value="lead">Lead/Principal (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900">
                {isLoading ? "Searching..." : `${results.length} Candidates Found`}
              </h2>
              <p className="text-sm text-muted-foreground">
                Showing results for your search criteria
              </p>
            </div>
            
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-slate-200 rounded w-1/3" />
                      <div className="h-4 bg-slate-200 rounded w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-slate-200 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : results.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Search className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No candidates found</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Try adjusting your filters or search criteria to find more candidates
                  </p>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      className="mt-4"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {results.map((result) => {
                  const candidate = result?.candidate;
                  const user = result?.user;
                  
                  // Skip if candidate data is missing
                  if (!candidate) return null;
                  
                  const skills = candidate?.skills ? candidate.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
                  
                  return (
                    <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-1">
                              {user?.name || 'Anonymous Candidate'}
                            </CardTitle>
                            {candidate.title && (
                              <CardDescription className="text-base font-medium text-slate-700">
                                {candidate.title}
                              </CardDescription>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                              {candidate.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {candidate.location}
                                </span>
                              )}
                              {user?.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-4 w-4" />
                                  {user.email}
                                </span>
                              )}
                              {candidate.phoneNumber && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  {candidate.phoneNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {candidate.bio && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Summary</h4>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {candidate.bio}
                            </p>
                          </div>
                        )}
                        
                        {skills.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {skills.slice(0, 8).map((skill, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                              {skills.length > 8 && (
                                <Badge variant="outline">+{skills.length - 8} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {candidate.experience && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Experience</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {candidate.experience}
                            </p>
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="flex gap-2">
                        <Button 
                          variant="default" 
                          className="flex-1"
                          onClick={() => {
                            if (user?.email) {
                              window.location.href = `mailto:${user.email}`;
                            }
                          }}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setLocation(`/recruiter/candidates/${candidate.id}`)}
                        >
                          View Full Profile
                        </Button>
                        {candidate.resumeUrl && (
                          <Button variant="outline" size="icon" asChild>
                            <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </RecruiterLayout>
  );
}
