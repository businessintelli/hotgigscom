import { useState, useEffect } from "react";
import RecruiterLayout from "@/components/RecruiterLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { 
  Search, Filter, X, Save, Tag, Users, MapPin, DollarSign, 
  Clock, Briefcase, Globe, CheckCircle2, SlidersHorizontal,
  Plus, Trash2
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AdvancedCandidateSearch() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Search filters
  const [keywords, setKeywords] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experienceRange, setExperienceRange] = useState<[number, number]>([0, 20]);
  const [location, setLocationFilter] = useState("");
  const [availability, setAvailability] = useState<string[]>([]);
  const [visaStatus, setVisaStatus] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 500000]);
  const [noticePeriod, setNoticePeriod] = useState<string[]>([]);
  const [willingToRelocate, setWillingToRelocate] = useState<boolean | undefined>(undefined);
  const [seniorityLevel, setSeniorityLevel] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);

  // UI state
  const [showFilters, setShowFilters] = useState(true);
  const [saveSearchDialogOpen, setSaveSearchDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("blue");
  const [bulkTagDialogOpen, setBulkTagDialogOpen] = useState(false);
  const [selectedBulkTags, setSelectedBulkTags] = useState<number[]>([]);

  // Fetch candidates with advanced search
  const { data: searchResults, isLoading, refetch } = trpc.candidateSearch.advancedSearch.useQuery({
    keywords: keywords || undefined,
    skills: selectedSkills.length > 0 ? selectedSkills : undefined,
    experienceYears: {
      min: experienceRange[0],
      max: experienceRange[1],
    },
    location: location || undefined,
    availability: availability.length > 0 ? availability : undefined,
    visaStatus: visaStatus.length > 0 ? visaStatus : undefined,
    salaryRange: {
      min: salaryRange[0],
      max: salaryRange[1],
    },
    noticePeriod: noticePeriod.length > 0 ? noticePeriod : undefined,
    willingToRelocate,
    seniorityLevel: seniorityLevel.length > 0 ? seniorityLevel : undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    limit: 50,
  });

  // Fetch tags
  const { data: tags, refetch: refetchTags } = trpc.candidateSearch.getTags.useQuery();

  // Fetch saved searches
  const { data: savedSearches, refetch: refetchSavedSearches } = trpc.candidateSearch.getSavedSearches.useQuery();

  // Mutations
  const createTagMutation = trpc.candidateSearch.createTag.useMutation({
    onSuccess: () => {
      refetchTags();
      setCreateTagDialogOpen(false);
      setNewTagName("");
      toast.success("Tag created successfully!");
    },
  });

  const bulkAssignTagsMutation = trpc.candidateSearch.bulkAssignTags.useMutation({
    onSuccess: () => {
      setBulkTagDialogOpen(false);
      setSelectedBulkTags([]);
      setSelectedCandidates([]);
      toast.success("Tags assigned successfully!");
      refetch();
    },
  });

  const saveSearchMutation = trpc.candidateSearch.saveSearch.useMutation({
    onSuccess: () => {
      refetchSavedSearches();
      setSaveSearchDialogOpen(false);
      setSearchName("");
      toast.success("Search saved successfully!");
    },
  });

  const deleteSavedSearchMutation = trpc.candidateSearch.deleteSavedSearch.useMutation({
    onSuccess: () => {
      refetchSavedSearches();
      toast.success("Saved search deleted!");
    },
  });

  // Add skill
  const handleAddSkill = () => {
    if (skillInput.trim() && !selectedSkills.includes(skillInput.trim())) {
      setSelectedSkills([...selectedSkills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  // Remove skill
  const handleRemoveSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  // Toggle checkbox filters
  const toggleArrayFilter = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(v => v !== value));
    } else {
      setter([...array, value]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setKeywords("");
    setSelectedSkills([]);
    setExperienceRange([0, 20]);
    setLocationFilter("");
    setAvailability([]);
    setVisaStatus([]);
    setSalaryRange([0, 500000]);
    setNoticePeriod([]);
    setWillingToRelocate(undefined);
    setSeniorityLevel([]);
    setSelectedTags([]);
  };

  // Active filter count
  const activeFilterCount = [
    keywords,
    selectedSkills.length > 0,
    experienceRange[0] > 0 || experienceRange[1] < 20,
    location,
    availability.length > 0,
    visaStatus.length > 0,
    salaryRange[0] > 0 || salaryRange[1] < 500000,
    noticePeriod.length > 0,
    willingToRelocate !== undefined,
    seniorityLevel.length > 0,
    selectedTags.length > 0,
  ].filter(Boolean).length;

  // Save current search
  const handleSaveSearch = () => {
    const searchQuery = JSON.stringify({
      keywords,
      skills: selectedSkills,
      experienceRange,
      location,
      availability,
      visaStatus,
      salaryRange,
      noticePeriod,
      willingToRelocate,
      seniorityLevel,
      tags: selectedTags,
    });

    saveSearchMutation.mutate({ name: searchName, searchQuery });
  };

  // Load saved search
  const handleLoadSearch = (searchQuery: string) => {
    try {
      const parsed = JSON.parse(searchQuery);
      setKeywords(parsed.keywords || "");
      setSelectedSkills(parsed.skills || []);
      setExperienceRange(parsed.experienceRange || [0, 20]);
      setLocationFilter(parsed.location || "");
      setAvailability(parsed.availability || []);
      setVisaStatus(parsed.visaStatus || []);
      setSalaryRange(parsed.salaryRange || [0, 500000]);
      setNoticePeriod(parsed.noticePeriod || []);
      setWillingToRelocate(parsed.willingToRelocate);
      setSeniorityLevel(parsed.seniorityLevel || []);
      setSelectedTags(parsed.tags || []);
      toast.success("Search loaded!");
    } catch (error) {
      toast.error("Failed to load search");
    }
  };

  // Bulk assign tags
  const handleBulkAssignTags = () => {
    if (selectedCandidates.length === 0) {
      toast.error("Please select candidates first");
      return;
    }
    if (selectedBulkTags.length === 0) {
      toast.error("Please select at least one tag");
      return;
    }
    bulkAssignTagsMutation.mutate({
      candidateIds: selectedCandidates,
      tagIds: selectedBulkTags,
    });
  };

  // Toggle candidate selection
  const toggleCandidateSelection = (candidateId: number) => {
    if (selectedCandidates.includes(candidateId)) {
      setSelectedCandidates(selectedCandidates.filter(id => id !== candidateId));
    } else {
      setSelectedCandidates([...selectedCandidates, candidateId]);
    }
  };

  // Select all candidates
  const handleSelectAll = () => {
    if (selectedCandidates.length === searchResults?.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(searchResults?.map((r: any) => r.candidate.id) || []);
    }
  };

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <RecruiterLayout title="Candidates">
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Advanced Candidate Search</h1>
            <p className="text-xs sm:text-sm text-gray-600">Find the perfect candidates with smart filters</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/recruiter/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 space-y-4 ${showFilters ? "block" : "hidden lg:block"}`}>
            {/* Boolean Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Boolean Search
                </CardTitle>
                <CardDescription className="text-xs">
                  Use AND, OR, NOT operators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="javascript AND (react OR vue) NOT angular"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">
                  Example: "python AND machine learning NOT junior"
                </p>
              </CardContent>
            </Card>

            {/* Skills Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Required Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add skill..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={handleAddSkill}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleRemoveSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Experience Range */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Experience (Years)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  {experienceRange[0]} - {experienceRange[1]} years
                </div>
                <Slider
                  value={experienceRange}
                  onValueChange={(value) => setExperienceRange(value as [number, number])}
                  min={0}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="City, state, or country"
                  value={location}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="text-sm"
                />
              </CardContent>
            </Card>

            {/* Salary Range */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Salary Expectations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  ${salaryRange[0].toLocaleString()} - ${salaryRange[1].toLocaleString()}
                </div>
                <Slider
                  value={salaryRange}
                  onValueChange={(value) => setSalaryRange(value as [number, number])}
                  min={0}
                  max={500000}
                  step={10000}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {["immediate", "2-weeks", "1-month", "2-months"].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={availability.includes(value)}
                      onCheckedChange={() => toggleArrayFilter(availability, value, setAvailability)}
                    />
                    <Label className="text-sm capitalize">{value.replace("-", " ")}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Visa Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Visa Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {["citizen", "permanent-resident", "work-visa", "requires-sponsorship"].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={visaStatus.includes(value)}
                      onCheckedChange={() => toggleArrayFilter(visaStatus, value, setVisaStatus)}
                    />
                    <Label className="text-sm capitalize">{value.replace("-", " ")}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notice Period */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notice Period</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {["immediate", "2-weeks", "1-month", "2-months", "3-months"].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={noticePeriod.includes(value)}
                      onCheckedChange={() => toggleArrayFilter(noticePeriod, value, setNoticePeriod)}
                    />
                    <Label className="text-sm capitalize">{value.replace("-", " ")}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Seniority Level */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seniority Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {["entry", "mid", "senior", "lead"].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={seniorityLevel.includes(value)}
                      onCheckedChange={() => toggleArrayFilter(seniorityLevel, value, setSeniorityLevel)}
                    />
                    <Label className="text-sm capitalize">{value}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tags Filter */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreateTagDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {tags?.map((tag: any) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={() => {
                        if (selectedTags.includes(tag.id)) {
                          setSelectedTags(selectedTags.filter(id => id !== tag.id));
                        } else {
                          setSelectedTags([...selectedTags, tag.id]);
                        }
                      }}
                    />
                    <Badge variant="secondary" className="text-sm">
                      {tag.name}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSaveSearchDialogOpen(true)}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Search
              </Button>
            </div>

            {/* Saved Searches */}
            {savedSearches && savedSearches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Saved Searches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {savedSearches.map((search: any) => (
                    <div key={search.id} className="flex items-center justify-between p-2 border rounded">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 justify-start"
                        onClick={() => handleLoadSearch(search.keyword || "{}")}
                      >
                        {search.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSavedSearchMutation.mutate({ id: search.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {/* Results Header */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Search Results ({searchResults?.length || 0})
                    </CardTitle>
                    <CardDescription>
                      {activeFilterCount > 0 && `${activeFilterCount} active filters`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {selectedCandidates.length > 0 && (
                      <>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {selectedCandidates.length} selected
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setBulkTagDialogOpen(true)}
                        >
                          <Tag className="w-4 h-4 mr-1" />
                          Tag
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSelectAll}
                    >
                      {selectedCandidates.length === searchResults?.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Candidates List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((result: any) => (
                  <Card key={result.candidate.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedCandidates.includes(result.candidate.id)}
                          onCheckedChange={() => toggleCandidateSelection(result.candidate.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {result.user?.name || "Anonymous"}
                              </h3>
                              <p className="text-sm text-gray-600">{result.candidate.title}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {result.candidate.availability && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {result.candidate.availability.replace("-", " ")}
                                </Badge>
                              )}
                              {result.candidate.visaStatus && (
                                <Badge variant="outline" className="text-xs">
                                  <Globe className="w-3 h-3 mr-1" />
                                  {result.candidate.visaStatus.replace("-", " ")}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                            {result.candidate.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {result.candidate.location}
                              </div>
                            )}
                            {result.candidate.totalExperienceYears && (
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                {result.candidate.totalExperienceYears} years experience
                              </div>
                            )}
                            {result.candidate.expectedSalaryMin && result.candidate.expectedSalaryMax && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                ${result.candidate.expectedSalaryMin.toLocaleString()} - ${result.candidate.expectedSalaryMax.toLocaleString()}
                              </div>
                            )}
                            {result.candidate.willingToRelocate && (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                Willing to relocate
                              </div>
                            )}
                          </div>

                          {result.candidate.skills && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {JSON.parse(result.candidate.skills || "[]").slice(0, 8).map((skill: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {result.candidate.bio && (
                            <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                              {result.candidate.bio}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              View Profile
                            </Button>
                            <Button size="sm">
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No candidates found matching your criteria</p>
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Save Search Dialog */}
      <Dialog open={saveSearchDialogOpen} onOpenChange={setSaveSearchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Give this search a name to save it for later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Search Name</Label>
              <Input
                placeholder="e.g., Senior React Developers"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveSearchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch} disabled={!searchName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tag Dialog */}
      <Dialog open={createTagDialogOpen} onOpenChange={setCreateTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Create a tag to organize candidates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tag Name</Label>
              <Input
                placeholder="e.g., Top Talent"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
            </div>
            <div>
              <Label>Color</Label>
              <Select value={newTagColor} onValueChange={setNewTagColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createTagMutation.mutate({ name: newTagName, color: newTagColor })}
              disabled={!newTagName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Tag Assignment Dialog */}
      <Dialog open={bulkTagDialogOpen} onOpenChange={setBulkTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Tags</DialogTitle>
            <DialogDescription>
              Select tags to assign to {selectedCandidates.length} candidate(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tags?.map((tag: any) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedBulkTags.includes(tag.id)}
                  onCheckedChange={() => {
                    if (selectedBulkTags.includes(tag.id)) {
                      setSelectedBulkTags(selectedBulkTags.filter(id => id !== tag.id));
                    } else {
                      setSelectedBulkTags([...selectedBulkTags, tag.id]);
                    }
                  }}
                />
                <Badge variant="secondary">{tag.name}</Badge>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAssignTags} disabled={selectedBulkTags.length === 0}>
              Assign Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </RecruiterLayout>
  );
}
