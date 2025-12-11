import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Play, CheckCircle, XCircle, Clock, Code2, Terminal } from "lucide-react";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";

/**
 * Coding Interview Page - Technical assessment with code editor
 * Features:
 * - Monaco Editor (VS Code editor)
 * - Multi-language support (Python, JavaScript, Java, C++)
 * - Real-time code execution
 * - Automated test case validation
 * - Score calculation
 */
export default function CodingInterviewPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const challengeId = parseInt(new URLSearchParams(search).get("id") || "0");
  
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<"python" | "javascript" | "java" | "cpp">("python");
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Fetch challenge details
  const { data: challenge, isLoading } = trpc.coding.getChallenge.useQuery(
    { challengeId },
    { enabled: challengeId > 0 }
  );
  
  // Submit code mutation
  const submitCodeMutation = trpc.coding.submitCode.useMutation();
  
  // Initialize code with starter code
  useEffect(() => {
    if (challenge?.starterCode) {
      setCode(challenge.starterCode);
    }
    if (challenge?.language) {
      setLanguage(challenge.language as any);
    }
  }, [challenge]);
  
  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error("Please write some code first");
      return;
    }
    
    setIsRunning(true);
    setShowResults(false);
    
    try {
      const result = await submitCodeMutation.mutateAsync({
        challengeId,
        code,
        language,
      });
      
      setTestResults(result.testResults || []);
      setShowResults(true);
      
      if (result.status === "passed") {
        toast.success(`All tests passed! Score: ${result.score}/100`);
      } else if (result.status === "failed") {
        toast.error(`Some tests failed. Score: ${result.score}/100`);
      } else {
        toast.error("Code execution error");
      }
    } catch (error) {
      console.error("Code execution error:", error);
      toast.error("Failed to run code");
    } finally {
      setIsRunning(false);
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
  
  const getEditorLanguage = (lang: string) => {
    if (lang === "cpp") return "cpp";
    return lang;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading challenge...</p>
        </div>
      </div>
    );
  }
  
  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Challenge Not Found</CardTitle>
            <CardDescription>The coding challenge you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/candidate/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const testCases = challenge.testCases ? JSON.parse(challenge.testCases) : [];
  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length || testCases.length;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Code2 className="h-6 w-6" />
                  {challenge.title}
                </CardTitle>
                <CardDescription className="mt-2">
                  <div className="flex items-center gap-4">
                    <Badge variant={
                      challenge.difficulty === "easy" ? "default" :
                      challenge.difficulty === "medium" ? "secondary" : "destructive"
                    }>
                      {challenge.difficulty.toUpperCase()}
                    </Badge>
                    {challenge.timeLimit && (
                      <span className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4" />
                        {challenge.timeLimit} seconds
                      </span>
                    )}
                  </div>
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={handleRunCode} 
                  disabled={isRunning}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Code
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Problem Description */}
          <Card className="h-[calc(100vh-200px)] overflow-auto">
            <CardHeader>
              <CardTitle>Problem Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{challenge.description}</p>
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Test Cases:</h3>
                <div className="space-y-2">
                  {testCases.map((testCase: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                      <div className="text-sm">
                        <div className="font-mono">
                          <span className="text-gray-600">Input:</span> {JSON.stringify(testCase.input)}
                        </div>
                        <div className="font-mono mt-1">
                          <span className="text-gray-600">Expected Output:</span> {JSON.stringify(testCase.output)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Right: Code Editor and Results */}
          <div className="space-y-4">
            {/* Code Editor */}
            <Card className="h-[calc(60vh-120px)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Code Editor - {getLanguageLabel(language)}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                <Editor
                  height="100%"
                  language={getEditorLanguage(language)}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                  }}
                />
              </CardContent>
            </Card>
            
            {/* Test Results */}
            {showResults && (
              <Card className="h-[calc(40vh-120px)] overflow-auto">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Test Results</span>
                    <Badge variant={passedTests === totalTests ? "default" : "destructive"}>
                      {passedTests}/{totalTests} Passed
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {testResults.map((result, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Test Case {index + 1}</span>
                          {result.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="text-sm space-y-1 font-mono">
                          <div><span className="text-gray-600">Input:</span> {JSON.stringify(result.input)}</div>
                          <div><span className="text-gray-600">Expected:</span> {JSON.stringify(result.expected)}</div>
                          <div><span className="text-gray-600">Got:</span> {JSON.stringify(result.actual)}</div>
                          {result.error && (
                            <div className="text-red-600 mt-2">Error: {result.error}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
