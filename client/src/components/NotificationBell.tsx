import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Query notifications
  const { data: notifications = [], refetch } = trpc.notification.list.useQuery(
    { limit: 50 },
    { enabled: true, refetchInterval: 30000 } // Poll every 30 seconds
  );

  // Query unread count
  const { data: unreadCount = 0, refetch: refetchCount } = trpc.notification.getUnreadCount.useQuery(
    undefined,
    { enabled: true, refetchInterval: 30000 } // Poll every 30 seconds
  );

  // Mark as read mutation
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
      refetchCount();
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      refetchCount();
    },
  });

  // Delete notification mutation
  const deleteMutation = trpc.notification.delete.useMutation({
    onSuccess: () => {
      refetch();
      refetchCount();
    },
  });

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate({ notificationId: notification.id });
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
      setOpen(false);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate({ notificationId });
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "application":
        return "📝";
      case "interview":
        return "🎥";
      case "status_change":
        return "🔄";
      case "message":
        return "💬";
      default:
        return "🔔";
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                    !notification.isRead ? "bg-blue-50 dark:bg-blue-950/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm">
                          {notification.title}
                        </h4>
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="text-muted-foreground hover:text-foreground text-xs"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
