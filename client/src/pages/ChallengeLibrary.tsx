import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Code2, Search, Filter, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

/**
 * Challenge Library - Manage coding challenges for technical assessments
 * Features:
 * - Browse challenges by difficulty, language, category
 * - Create custom challenges with test cases
 * - Edit and delete challenges
 * - Preview challenges
 */
export default function ChallengeLibrary() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Form state for creating challenges
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    language: "python" as "python" | "javascript" | "java" | "cpp",
    difficulty: "medium" as "easy" | "medium" | "hard",
    starterCode: "",
    testCases: "[]",
    timeLimit: 300,
  });
  
  // Fetch challenges
  const { data: challenges, isLoading, refetch } = trpc.coding.listChallenges.useQuery();
  
  // Create challenge mutation
  const createChallengeMutation = trpc.coding.createChallenge.useMutation({
    onSuccess: () => {
      toast.success("Challenge created successfully");
      setCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to create challenge: ${error.message}`);
    },
  });
  
  // Delete challenge mutation
  const deleteChallengeMutation = trpc.coding.deleteChallenge.useMutation({
    onSuccess: () => {
      toast.success("Challenge deleted successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete challenge: ${error.message}`);
    },
  });
  
  const resetForm = () => {
    setNewChallenge({
      title: "",
      description: "",
      language: "python",
      difficulty: "medium",
      starterCode: "",
      testCases: "[]",
      timeLimit: 300,
    });
  };
  
  const handleCreateChallenge = async () => {
    if (!newChallenge.title || !newChallenge.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Validate test cases JSON
    try {
      JSON.parse(newChallenge.testCases);
    } catch {
      toast.error("Invalid test cases JSON format");
      return;
    }
    
    await createChallengeMutation.mutateAsync({
      title: newChallenge.title,
      description: newChallenge.description,
      language: newChallenge.language,
      difficulty: newChallenge.difficulty,
      starterCode: newChallenge.starterCode || undefined,
      testCases: newChallenge.testCases,
      timeLimit: newChallenge.timeLimit,
    });
  };
  
  const handleDeleteChallenge = async (challengeId: number) => {
    if (confirm("Are you sure you want to delete this challenge?")) {
      await deleteChallengeMutation.mutateAsync({ challengeId });
    }
  };
  
  // Filter challenges
  const filteredChallenges = challenges?.filter((challenge: any) => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === "all" || challenge.difficulty === difficultyFilter;
    const matchesLanguage = languageFilter === "all" || challenge.language === languageFilter;
    return matchesSearch && matchesDifficulty && matchesLanguage;
  }) || [];
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      python: "Python",
      javascript: "JavaScript",
      java: "Java",
      cpp: "C++",
    };
    return labels[lang] || lang;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Code2 className="h-8 w-8" />
              Coding Challenge Library
            </h1>
            <p className="text-gray-600 mt-1">
              Manage technical assessment challenges for candidates
            </p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Challenge</DialogTitle>
                <DialogDescription>
                  Create a custom coding challenge with test cases
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    placeholder="e.g., Two Sum Problem"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                    placeholder="Describe the problem, input/output format, constraints..."
                    rows={6}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={newChallenge.language}
                      onValueChange={(v: any) => setNewChallenge({ ...newChallenge, language: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={newChallenge.difficulty}
                      onValueChange={(v: any) => setNewChallenge({ ...newChallenge, difficulty: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="starterCode">Starter Code (Optional)</Label>
                  <Textarea
                    id="starterCode"
                    value={newChallenge.starterCode}
                    onChange={(e) => setNewChallenge({ ...newChallenge, starterCode: e.target.value })}
                    placeholder="def solution(input):\n    # Your code here\n    pass"
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
                
                <div>
                  <Label htmlFor="testCases">Test Cases (JSON Array) *</Label>
                  <Textarea
                    id="testCases"
                    value={newChallenge.testCases}
                    onChange={(e) => setNewChallenge({ ...newChallenge, testCases: e.target.value })}
                    placeholder='[{"input": [2, 7, 11, 15], "output": [0, 1]}]'
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: Array of objects with "input" and "output" fields
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={newChallenge.timeLimit}
                    onChange={(e) => setNewChallenge({ ...newChallenge, timeLimit: parseInt(e.target.value) })}
                    min={60}
                    max={3600}
                  />
                </div>
                
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateChallenge}
                    disabled={createChallengeMutation.isPending}
                  >
                    {createChallengeMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Challenge"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search challenges..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Challenge List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChallenges.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Code2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No challenges found. Create your first challenge!</p>
              </CardContent>
            </Card>
          ) : (
            filteredChallenges.map((challenge: any) => (
              <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {challenge.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getLanguageLabel(challenge.language)}</Badge>
                      {challenge.timeLimit && (
                        <span className="text-xs text-gray-500">
                          {Math.floor(challenge.timeLimit / 60)}min
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setLocation(`/coding-interview?id=${challenge.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteChallenge(challenge.id)}
                        disabled={deleteChallengeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
