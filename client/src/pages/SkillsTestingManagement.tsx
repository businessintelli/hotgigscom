import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Code, Brain, FileText, Clock, Target, TrendingUp, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SkillsTestingManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    testName: "",
    testType: "coding" as "coding" | "personality" | "domain-specific" | "aptitude" | "technical",
    category: "",
    description: "",
    duration: 30,
    passingScore: 70,
    difficulty: "medium" as "easy" | "medium" | "hard" | "expert",
    isPublic: false,
  });

  const { data: tests = [], refetch } = trpc.skillsTesting.getMyTests.useQuery();
  const createTestMutation = trpc.skillsTesting.createTest.useMutation({
    onSuccess: () => {
      toast({
        title: "Test Created",
        description: "Your test has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      refetch();
      // Reset form
      setNewTest({
        testName: "",
        testType: "coding",
        category: "",
        description: "",
        duration: 30,
        passingScore: 70,
        difficulty: "medium",
        isPublic: false,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTest = () => {
    if (!newTest.testName || !newTest.duration || !newTest.passingScore) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createTestMutation.mutate(newTest);
  };

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case "coding":
        return <Code className="h-5 w-5" />;
      case "personality":
        return <Brain className="h-5 w-5" />;
      case "domain-specific":
      case "aptitude":
      case "technical":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "hard":
        return "bg-orange-500";
      case "expert":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const codingTests = tests.filter(t => t.testType === "coding");
  const personalityTests = tests.filter(t => t.testType === "personality");
  const otherTests = tests.filter(t => !["coding", "personality"].includes(t.testType));

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Skills Testing Platform</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage assessments for comprehensive candidate evaluation
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Test</DialogTitle>
              <DialogDescription>
                Design a comprehensive assessment to evaluate candidate skills
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="testName">Test Name *</Label>
                <Input
                  id="testName"
                  placeholder="e.g., JavaScript Fundamentals"
                  value={newTest.testName}
                  onChange={(e) => setNewTest({ ...newTest, testName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="testType">Test Type *</Label>
                  <Select
                    value={newTest.testType}
                    onValueChange={(value: any) => setNewTest({ ...newTest, testType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coding">Coding Challenge</SelectItem>
                      <SelectItem value="personality">Personality Assessment</SelectItem>
                      <SelectItem value="domain-specific">Domain-Specific</SelectItem>
                      <SelectItem value="aptitude">Aptitude Test</SelectItem>
                      <SelectItem value="technical">Technical Knowledge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., JavaScript, Big Five, Sales"
                    value={newTest.category}
                    onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this test evaluates..."
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={newTest.duration}
                    onChange={(e) => setNewTest({ ...newTest, duration: parseInt(e.target.value) })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="passingScore">Passing Score (%) *</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min="0"
                    max="100"
                    value={newTest.passingScore}
                    onChange={(e) => setNewTest({ ...newTest, passingScore: parseInt(e.target.value) })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="difficulty">Difficulty *</Label>
                  <Select
                    value={newTest.difficulty}
                    onValueChange={(value: any) => setNewTest({ ...newTest, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTest} disabled={createTestMutation.isPending}>
                {createTestMutation.isPending ? "Creating..." : "Create Test"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coding Tests</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{codingTests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personality Tests</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personalityTests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.filter(t => t.isActive).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Test Library */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Tests ({tests.length})</TabsTrigger>
          <TabsTrigger value="coding">Coding ({codingTests.length})</TabsTrigger>
          <TabsTrigger value="personality">Personality ({personalityTests.length})</TabsTrigger>
          <TabsTrigger value="other">Other ({otherTests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getTestTypeIcon(test.testType)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{test.testName}</CardTitle>
                        {test.category && (
                          <CardDescription className="mt-1">{test.category}</CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {test.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {test.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="capitalize">
                      {test.testType.replace("-", " ")}
                    </Badge>
                    <Badge className={getDifficultyColor(test.difficulty)}>
                      {test.difficulty}
                    </Badge>
                    {test.isPublic && <Badge variant="secondary">Public</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{test.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{test.passingScore}% pass</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Users className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {tests.length === 0 && (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tests yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first test to start evaluating candidates
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Test
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="coding" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {codingTests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Code className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{test.testName}</CardTitle>
                      {test.category && (
                        <CardDescription className="mt-1">{test.category}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {test.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {test.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getDifficultyColor(test.difficulty)}>
                      {test.difficulty}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{test.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{test.passingScore}% pass</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Users className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="personality" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalityTests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{test.testName}</CardTitle>
                      {test.category && (
                        <CardDescription className="mt-1">{test.category}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {test.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {test.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{test.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{test.passingScore}% pass</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Users className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherTests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{test.testName}</CardTitle>
                      {test.category && (
                        <CardDescription className="mt-1">{test.category}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {test.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {test.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="capitalize">
                      {test.testType.replace("-", " ")}
                    </Badge>
                    <Badge className={getDifficultyColor(test.difficulty)}>
                      {test.difficulty}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{test.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{test.passingScore}% pass</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Users className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
