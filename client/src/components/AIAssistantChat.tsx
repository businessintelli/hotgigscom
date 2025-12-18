import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2, Send, User, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type AIAssistantChatProps = {
  systemPrompt: string;
  placeholder?: string;
  className?: string;
  suggestedPrompts?: string[];
};

export function AIAssistantChat({
  systemPrompt,
  placeholder = "Type your message...",
  className,
  suggestedPrompts = [],
}: AIAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: typeof response === 'string' ? response : String(response),
      }]);
    },
    onError: (error) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message}`,
      }]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string) => {
    if (!content.trim()) return;
    
    const userMessage: Message = { role: "user", content: content.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    // Convert messages to the format expected by the API
    const apiMessages = [...messages, userMessage].map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    
    chatMutation.mutate({
      messages: apiMessages,
      systemPrompt,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              How can I help you today?
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md">
              Ask me anything about your career, job search, or recruitment needs.
            </p>
            {suggestedPrompts.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestedPrompts.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSend(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2",
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  {message.role === "assistant" ? (
                    <Streamdown>{message.content}</Streamdown>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
      
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || chatMutation.isPending}
            size="icon"
            className="h-11 w-11 flex-shrink-0"
          >
            {chatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
