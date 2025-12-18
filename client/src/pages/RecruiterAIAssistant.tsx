import { useState, useRef, useEffect } from "react";
import RecruiterLayout from "@/components/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Users,
  TrendingUp,
  MessageSquare,
  Briefcase,
  Target,
  BarChart3,
  Clock,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Quick action suggestions for recruiters
const quickActions = [
  { icon: BarChart3, label: "Pipeline overview", prompt: "Give me an overview of my current recruitment pipeline. How many candidates are in each stage?" },
  { icon: Users, label: "Top candidates", prompt: "Who are my top candidates right now? Which ones should I prioritize?" },
  { icon: TrendingUp, label: "Job performance", prompt: "How are my job postings performing? Which ones are getting the most applications?" },
  { icon: Clock, label: "Time to hire", prompt: "What's my average time to hire? How can I speed up the process?" },
  { icon: AlertTriangle, label: "Backout analysis", prompt: "Have I had any candidate backouts or offer rejections recently? What might be causing them?" },
  { icon: Target, label: "Hiring metrics", prompt: "What are my key hiring metrics? Offer acceptance rate, interview-to-hire ratio, etc." },
  { icon: Briefcase, label: "Open positions", prompt: "What positions do I have open right now? Which ones need more candidates?" },
  { icon: MessageSquare, label: "Follow-up needed", prompt: "Are there any candidates I should follow up with? Any applications pending too long?" },
];

export default function RecruiterAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Recruiting Assistant. I have access to your job postings and candidate pipeline data. I can help you with:\n\n• **Pipeline management** - Track candidates across all stages\n• **Job performance** - Analyze which postings are performing best\n• **Candidate insights** - Compare and evaluate candidates\n• **Hiring metrics** - Time-to-hire, offer rates, conversion rates\n• **Backout analysis** - Understand why candidates drop off\n• **Process optimization** - Suggestions to improve your hiring\n\nWhat would you like to know?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aiAssistantMutation = trpc.recruiter.aiAssistant.useMutation();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Build conversation history (excluding the welcome message)
      const conversationHistory = messages
        .slice(1) // Skip welcome message
        .map(m => ({ role: m.role, content: m.content }));

      const result = await aiAssistantMutation.mutateAsync({
        message: text,
        conversationHistory,
      });

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to get response. Please try again.");
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <RecruiterLayout title="AI Assistant">
      <div className="container mx-auto py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Recruiting Assistant</h1>
              <p className="text-muted-foreground">Your intelligent assistant with access to your pipeline data</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                <CardDescription className="text-xs">Common questions to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => handleQuickAction(action.prompt)}
                    disabled={isLoading}
                  >
                    <action.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b py-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">AI Assistant Chat</CardTitle>
                </div>
              </CardHeader>
              
              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-green-500 text-white'
                            : 'bg-muted'
                        }`}>
                          <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                            {message.content.split('\n').map((line, i) => {
                              // Handle bold text
                              const parts = line.split(/(\*\*[^*]+\*\*)/g);
                              return (
                                <p key={i} className="mb-1 last:mb-0">
                                  {parts.map((part, j) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                      return <strong key={j}>{part.slice(2, -2)}</strong>;
                                    }
                                    return part;
                                  })}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Analyzing your data...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              </div>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your pipeline, candidates, hiring metrics..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handleSendMessage()} 
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  AI Assistant has access to your job postings and candidate pipeline data.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RecruiterLayout>
  );
}
