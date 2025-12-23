import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Question from "@/pages/question";
import Admin from "@/pages/admin";
import Profile from "@/pages/profile";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile" component={Profile} />
      <Route path="/question/:id" component={Question} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function NotificationsPanel() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          setUnreadCount(data.filter((n: any) => !n.isRead).length);
        }
      } catch (err) {}
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId: number) => {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      credentials: 'include'
    });
    setNotifications(notifications.map(n => n.id === notificationId ? {...n, isRead: true} : n));
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setShowPanel(!showPanel)}
        className="relative"
        data-testid="button-notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {showPanel && (
        <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-80 max-h-96 overflow-y-auto" data-testid="notifications-panel">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold">الإشعارات</h3>
            <Button size="icon" variant="ghost" onClick={() => setShowPanel(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-gray-500 text-center text-sm">لا توجد إشعارات</p>
          ) : (
            <div className="divide-y">
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => markAsRead(n.id)}
                  data-testid={`notification-${n.id}`}
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{n.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground" dir="rtl">
          <Toaster />
          <NotificationsPanel />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
