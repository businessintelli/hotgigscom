import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { MessageSquare, X, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function OrionChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Orion, your AI career assistant. I can help you with:\n\n- Resume optimization tips\n- Interview preparation\n- Career advice\n- Job search strategies\n- Salary negotiation\n\nHow can I assist you today?",
    },
  ]);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response: { message: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.message,
        },
      ]);
    },
    onError: (error: any) => {
      toast.error("Failed to get response from Orion");
      console.error(error);
    },
  });

  const handleSendMessage = (content: string) => {
    // Add user message
    setMessages((prev) => [...prev, { role: "user", content }]);

    // Send to AI
    chatMutation.mutate({
      messages: [...messages, { role: "user", content }],
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 z-50"
          size="icon"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <CardTitle className="text-white">Orion AI Assistant</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-blue-100 mt-1">
              Your 24/7 career coach
            </p>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <AIChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={chatMutation.isPending}
              placeholder="Ask Orion anything..."
              height="100%"
              suggestedPrompts={[
                "Help me improve my resume",
                "Prepare for an interview",
                "Negotiate my salary",
                "Find the right career path",
              ]}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
