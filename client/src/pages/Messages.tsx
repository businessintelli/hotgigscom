import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, Paperclip, Search, MoreVertical, FileText, Image as ImageIcon, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], refetch: refetchConversations } = trpc.messaging.getMyConversations.useQuery();
  const { data: messages = [], refetch: refetchMessages } = trpc.messaging.getMessages.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId }
  );

  const sendMessageMutation = trpc.messaging.sendMessage.useMutation({
    onSuccess: () => {
      setMessageContent("");
      refetchMessages();
      refetchConversations();
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: templates = [] } = trpc.messaging.getMyTemplates.useQuery();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedConversationId) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: messageContent,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((conv: any) => {
    const otherParty = conv.candidate || conv.recruiter;
    const otherPartyUser = conv.candidateUser || conv.recruiterUser;
    const name = otherPartyUser?.name || otherPartyUser?.email || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConversation = conversations.find((c: any) => c.conversation.id === selectedConversationId);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-18rem)]">
              {filteredConversations.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No conversations yet</p>
                </div>
              )}
              {filteredConversations.map((conv: any) => {
                const otherParty = conv.candidate || conv.recruiter;
                const otherPartyUser = conv.candidateUser || conv.recruiterUser;
                const isSelected = conv.conversation.id === selectedConversationId;

                return (
                  <div
                    key={conv.conversation.id}
                    className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                      isSelected ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedConversationId(conv.conversation.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {(otherPartyUser?.name || otherPartyUser?.email || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold truncate">
                            {otherPartyUser?.name || otherPartyUser?.email}
                          </h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatDistanceToNow(new Date(conv.conversation.lastMessageAt), { addSuffix: true })}
                          </span>
                        </div>
                        {conv.conversation.subject && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.conversation.subject}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          {selectedConversationId ? (
            <CardContent className="p-0 flex flex-col h-full">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {selectedConversation
                        ? (
                            (selectedConversation as any).candidateUser?.name ||
                            (selectedConversation as any).recruiterUser?.name ||
                            (selectedConversation as any).candidateUser?.email ||
                            (selectedConversation as any).recruiterUser?.email ||
                            "?"
                          ).charAt(0).toUpperCase()
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {selectedConversation
                        ? (selectedConversation as any).candidateUser?.name ||
                          (selectedConversation as any).recruiterUser?.name ||
                          (selectedConversation as any).candidateUser?.email ||
                          (selectedConversation as any).recruiterUser?.email
                        : ""}
                    </h3>
                    {(selectedConversation as any)?.conversation.subject && (
                      <p className="text-sm text-muted-foreground">
                        {(selectedConversation as any).conversation.subject}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg: any) => {
                    const isOwnMessage = msg.senderType === "recruiter"; // Simplified - should check actual user

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.attachments.map((att: any) => (
                                <div
                                  key={att.id}
                                  className="flex items-center gap-2 p-2 bg-background/10 rounded"
                                >
                                  {att.mimeType.startsWith("image/") ? (
                                    <ImageIcon className="h-4 w-4" />
                                  ) : (
                                    <File className="h-4 w-4" />
                                  )}
                                  <span className="text-xs truncate">{att.fileName}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <span className="text-xs opacity-70 mt-1 block">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type a message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyPress={handleKeyPress}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="icon">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!messageContent.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Quick Templates */}
                {templates.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {templates.slice(0, 3).map((template: any) => (
                      <Badge
                        key={template.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => setMessageContent(template.content)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        {template.templateName}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
