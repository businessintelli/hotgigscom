import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Code, Brain, FileText, Trash2, Edit, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QuestionBank() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");

  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    questionType: "coding" as const,
    difficulty: "medium" as const,
    category: "",
    tags: [] as string[],
    correctAnswer: "",
    codeTemplate: "",
    testCases: [{ input: "", expectedOutput: "" }],
    timeLimit: 300,
    memoryLimit: 256,
    points: 10,
    isPublic: false,
  });

  const { data: questions = [], refetch } = trpc.questionBank.getMyQuestions.useQuery({
    questionType: filterType !== "all" ? filterType : undefined,
    difficulty: filterDifficulty !== "all" ? filterDifficulty : undefined,
    searchTerm: searchTerm || undefined,
  });

  const createQuestionMutation = trpc.questionBank.createQuestion.useMutation({
    onSuccess: () => {
      toast({
        title: "Question Created",
        description: "Your question has been added to the bank",
      });
      setIsCreateDialogOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = trpc.questionBank.deleteQuestion.useMutation({
    onSuccess: () => {
      toast({
        title: "Question Deleted",
        description: "The question has been removed from your bank",
      });
      refetch();
    },
  });

  const resetForm = () => {
    setNewQuestion({
      questionText: "",
      questionType: "coding",
      difficulty: "medium",
      category: "",
      tags: [],
      correctAnswer: "",
      codeTemplate: "",
      testCases: [{ input: "", expectedOutput: "" }],
      timeLimit: 300,
      memoryLimit: 256,
      points: 10,
      isPublic: false,
    });
  };

  const handleCreateQuestion = () => {
    createQuestionMutation.mutate(newQuestion);
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteQuestionMutation.mutate({ questionId });
    }
  };

  const addTestCase = () => {
    setNewQuestion({
      ...newQuestion,
      testCases: [...newQuestion.testCases, { input: "", expectedOutput: "" }],
    });
  };

  const updateTestCase = (index: number, field: 'input' | 'expectedOutput', value: string) => {
    const updated = [...newQuestion.testCases];
    updated[index][field] = value;
    setNewQuestion({ ...newQuestion, testCases: updated });
  };

  const removeTestCase = (index: number) => {
    setNewQuestion({
      ...newQuestion,
      testCases: newQuestion.testCases.filter((_, i) => i !== index),
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'coding': return <Code className="h-4 w-4" />;
      case 'personality': return <Brain className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage reusable questions for your assessments
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Question</DialogTitle>
              <DialogDescription>
                Add a new question to your question bank
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="questionText">Question Text</Label>
                <Textarea
                  id="questionText"
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                  placeholder="Enter your question..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="questionType">Question Type</Label>
                  <Select
                    value={newQuestion.questionType}
                    onValueChange={(value: any) => setNewQuestion({ ...newQuestion, questionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coding">Coding</SelectItem>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="personality">Personality</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={newQuestion.difficulty}
                    onValueChange={(value: any) => setNewQuestion({ ...newQuestion, difficulty: value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                    placeholder="e.g., Algorithms, Data Structures"
                  />
                </div>
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              {newQuestion.questionType === 'coding' && (
                <>
                  <div>
                    <Label htmlFor="codeTemplate">Code Template (Optional)</Label>
                    <Textarea
                      id="codeTemplate"
                      value={newQuestion.codeTemplate}
                      onChange={(e) => setNewQuestion({ ...newQuestion, codeTemplate: e.target.value })}
                      placeholder="function solution() {&#10;  // Your code here&#10;}"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label>Test Cases</Label>
                    {newQuestion.testCases.map((testCase, index) => (
                      <div key={index} className="mt-2 p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Test Case {index + 1}</span>
                          {newQuestion.testCases.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTestCase(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          placeholder="Input"
                          value={testCase.input}
                          onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                        />
                        <Input
                          placeholder="Expected Output"
                          value={testCase.expectedOutput}
                          onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addTestCase}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Test Case
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        value={newQuestion.timeLimit}
                        onChange={(e) => setNewQuestion({ ...newQuestion, timeLimit: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="memoryLimit">Memory Limit (MB)</Label>
                      <Input
                        id="memoryLimit"
                        type="number"
                        value={newQuestion.memoryLimit}
                        onChange={(e) => setNewQuestion({ ...newQuestion, memoryLimit: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </>
              )}

              {newQuestion.questionType === 'multiple-choice' && (
                <div>
                  <Label htmlFor="correctAnswer">Correct Answer</Label>
                  <Input
                    id="correctAnswer"
                    value={newQuestion.correctAnswer}
                    onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                    placeholder="Enter the correct answer"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateQuestion} disabled={createQuestionMutation.isPending}>
                {createQuestionMutation.isPending ? "Creating..." : "Create Question"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="filterType">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="personality">Personality</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterDifficulty">Difficulty</Label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="grid grid-cols-1 gap-4">
        {questions.map((question: any) => (
          <Card key={question.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(question.question_type)}
                    <Badge variant="outline" className="capitalize">
                      {question.question_type.replace("-", " ")}
                    </Badge>
                    <Badge className={getDifficultyColor(question.difficulty)}>
                      {question.difficulty}
                    </Badge>
                    {question.category && (
                      <Badge variant="secondary">{question.category}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{question.question_text}</CardTitle>
                  <CardDescription className="mt-2">
                    {question.points} points • Used {question.usage_count} times
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
        {questions.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No questions found. Create your first question to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
