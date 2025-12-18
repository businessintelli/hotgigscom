import { useState, useRef, useEffect } from "react";
import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
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
  Loader2,
  Building2,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Quick action suggestions for company admins
const quickActions = [
  { icon: BarChart3, label: "Company overview", prompt: "Give me an overview of our company's recruitment performance. How many jobs, applications, and placements do we have?" },
  { icon: Users, label: "Team performance", prompt: "How are our recruiters performing? Who are the top performers?" },
  { icon: TrendingUp, label: "Hiring trends", prompt: "What are our hiring trends over the past quarter? Are we improving?" },
  { icon: Clock, label: "Time to hire", prompt: "What's our average time to hire across all recruiters? How can we improve?" },
  { icon: Briefcase, label: "Active jobs", prompt: "How many active job postings do we have? Which roles are hardest to fill?" },
  { icon: Target, label: "Placement rate", prompt: "What's our overall placement rate? How does it compare to industry standards?" },
  { icon: UserCheck, label: "Recruiter capacity", prompt: "Which recruiters have capacity to take on more jobs? Who's overloaded?" },
  { icon: MessageSquare, label: "InMail credits", prompt: "How are we using our LinkedIn InMail credits? Are we getting good ROI?" },
];

export default function CompanyAdminAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Company Admin Assistant. I have access to your company's recruitment data across all recruiters. I can help you with:\n\n• **Company-wide metrics** - Overall performance across all recruiters\n• **Team management** - Recruiter performance and capacity analysis\n• **Hiring trends** - Identify patterns and opportunities\n• **Resource optimization** - InMail credits, job distribution, workload\n• **Strategic insights** - Data-driven recommendations for improvement\n• **Compliance monitoring** - Track adherence to hiring processes\n\nWhat would you like to know about your company's recruitment operations?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aiAssistantMutation = trpc.companyAdmin.aiAssistant.useMutation();

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
    <CompanyAdminLayout>
      <div className="container mx-auto py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Company Admin Assistant</h1>
              <p className="text-muted-foreground">Your intelligent assistant with access to company-wide recruitment data</p>
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
                    variant="ghost"
                    size="sm"
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
            <Card className="h-[calc(100vh-250px)] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Chat with AI Assistant</CardTitle>
                </div>
                <CardDescription>Ask questions about your company's recruitment operations</CardDescription>
              </CardHeader>

              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg px-4 py-3 max-w-[80%] ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="rounded-lg px-4 py-3 bg-muted">
                        <Loader2 className="h-5 w-5 animate-spin" />
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
                    placeholder="Ask me anything about your recruitment operations..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </CompanyAdminLayout>
  );
}
