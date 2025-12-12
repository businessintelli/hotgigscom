import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Mail,
  MousePointerClick,
  Eye,
  Ban
} from "lucide-react";

export default function EmailDeliveryDashboard() {
  const { data: webhookLogs, isLoading: logsLoading, refetch } = trpc.admin.getWebhookLogs.useQuery({ limit: 50 });
  const { data: deliveryStats, isLoading: statsLoading } = trpc.admin.getDeliveryStats.useQuery();

  const stats = [
    {
      title: "Total Sent",
      value: deliveryStats?.totalSent || 0,
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Delivered",
      value: deliveryStats?.delivered || 0,
      percentage: deliveryStats?.totalSent 
        ? ((deliveryStats.delivered / deliveryStats.totalSent) * 100).toFixed(1) + "%"
        : "0%",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Bounced",
      value: deliveryStats?.bounced || 0,
      percentage: deliveryStats?.totalSent 
        ? ((deliveryStats.bounced / deliveryStats.totalSent) * 100).toFixed(1) + "%"
        : "0%",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Opened",
      value: deliveryStats?.opened || 0,
      percentage: deliveryStats?.delivered 
        ? ((deliveryStats.opened / deliveryStats.delivered) * 100).toFixed(1) + "%"
        : "0%",
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Clicked",
      value: deliveryStats?.clicked || 0,
      percentage: deliveryStats?.opened 
        ? ((deliveryStats.clicked / deliveryStats.opened) * 100).toFixed(1) + "%"
        : "0%",
      icon: MousePointerClick,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Spam Reports",
      value: deliveryStats?.spamReports || 0,
      icon: Ban,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  if (logsLoading || statsLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Email Delivery Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor email delivery performance, bounces, and engagement metrics across all campaigns.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">{stat.title}</div>
                {stat.percentage && (
                  <div className={`text-xs font-medium mt-1 ${stat.color}`}>
                    {stat.percentage}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Webhook Configuration Alert */}
      <Alert className="mb-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Webhook Setup Required:</strong> To receive real-time delivery events, configure webhooks in your email provider:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>SendGrid:</strong> Add <code className="text-sm bg-muted px-1 py-0.5 rounded">{window.location.origin}/api/webhooks/sendgrid</code> in Mail Settings → Event Webhook</li>
            <li><strong>Resend:</strong> Add <code className="text-sm bg-muted px-1 py-0.5 rounded">{window.location.origin}/api/webhooks/resend</code> in Webhooks settings</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Recent Webhook Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Webhook Events</CardTitle>
              <CardDescription>Latest delivery events received from email providers</CardDescription>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {webhookLogs && webhookLogs.length > 0 ? (
            <div className="space-y-3">
              {webhookLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.provider === 'sendgrid' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {log.provider}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-muted">
                        {log.eventType}
                      </span>
                      {log.verified ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      )}
                      {log.processed && (
                        <span className="text-xs text-green-600">✓ Processed</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                    {log.error && (
                      <div className="text-sm text-red-600 mt-1">
                        Error: {log.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No webhook events received yet. Configure webhooks in your email provider to start tracking delivery events.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Performance Comparison */}
      {deliveryStats && (deliveryStats.sendgridStats || deliveryStats.resendStats) && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Provider Performance Comparison</CardTitle>
            <CardDescription>Compare delivery rates between SendGrid and Resend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {deliveryStats.sendgridStats && (
                <div className="p-4 rounded-lg border">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    SendGrid
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Delivery Rate:</span>
                      <span className="font-medium">
                        {((deliveryStats.sendgridStats.delivered / deliveryStats.sendgridStats.sent) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bounce Rate:</span>
                      <span className="font-medium">
                        {((deliveryStats.sendgridStats.bounced / deliveryStats.sendgridStats.sent) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Open Rate:</span>
                      <span className="font-medium">
                        {deliveryStats.sendgridStats.delivered > 0
                          ? ((deliveryStats.sendgridStats.opened / deliveryStats.sendgridStats.delivered) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {deliveryStats.resendStats && (
                <div className="p-4 rounded-lg border">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                    Resend
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Delivery Rate:</span>
                      <span className="font-medium">
                        {((deliveryStats.resendStats.delivered / deliveryStats.resendStats.sent) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bounce Rate:</span>
                      <span className="font-medium">
                        {((deliveryStats.resendStats.bounced / deliveryStats.resendStats.sent) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Open Rate:</span>
                      <span className="font-medium">
                        {deliveryStats.resendStats.delivered > 0
                          ? ((deliveryStats.resendStats.opened / deliveryStats.resendStats.delivered) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
