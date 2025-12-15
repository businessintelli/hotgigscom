import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { 
  Mail, 
  ArrowLeft, 
  Send, 
  Eye, 
  MousePointer, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
  Calendar,
  RefreshCw
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function EmailCampaignAnalytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<string>("30d");

  // Fetch recruiter profile
  const { data: recruiter } = trpc.recruiter.getProfile.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  // Fetch campaigns
  const { data: campaigns, isLoading: loadingCampaigns } = trpc.emailCampaign.list.useQuery(
    { recruiterId: recruiter?.id || 0 },
    { enabled: !!recruiter?.id }
  );

  // Fetch campaign analytics
  const { data: analytics, isLoading: loadingAnalytics, refetch: refetchAnalytics } = trpc.emailCampaign.getAnalytics.useQuery(
    { campaignId: selectedCampaign || 0 },
    { enabled: !!selectedCampaign }
  );

  // Calculate overall stats
  const overallStats = campaigns?.reduce((acc, campaign) => {
    return {
      totalSent: acc.totalSent + (campaign.sentCount || 0),
      totalOpened: acc.totalOpened + (campaign.openedCount || 0),
      totalClicked: acc.totalClicked + (campaign.clickedCount || 0),
      totalBounced: acc.totalBounced + (campaign.bouncedCount || 0),
      totalReplied: acc.totalReplied + (campaign.repliedCount || 0),
    };
  }, { totalSent: 0, totalOpened: 0, totalClicked: 0, totalBounced: 0, totalReplied: 0 }) || { totalSent: 0, totalOpened: 0, totalClicked: 0, totalBounced: 0, totalReplied: 0 };

  const openRate = overallStats.totalSent > 0 ? (overallStats.totalOpened / overallStats.totalSent * 100).toFixed(1) : '0';
  const clickRate = overallStats.totalOpened > 0 ? (overallStats.totalClicked / overallStats.totalOpened * 100).toFixed(1) : '0';
  const bounceRate = overallStats.totalSent > 0 ? (overallStats.totalBounced / overallStats.totalSent * 100).toFixed(1) : '0';
  const replyRate = overallStats.totalSent > 0 ? (overallStats.totalReplied / overallStats.totalSent * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/recruiter/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Email Campaign Analytics
            </h1>
            <p className="text-gray-500">Track performance of your email campaigns</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Overall Stats */}
        <div className="grid md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Sent</p>
                  <p className="text-3xl font-bold text-blue-700">{overallStats.totalSent.toLocaleString()}</p>
                </div>
                <Send className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Open Rate</p>
                  <p className="text-3xl font-bold text-green-700">{openRate}%</p>
                </div>
                <Eye className="h-8 w-8 text-green-500" />
              </div>
              <Progress value={parseFloat(openRate)} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Click Rate</p>
                  <p className="text-3xl font-bold text-purple-700">{clickRate}%</p>
                </div>
                <MousePointer className="h-8 w-8 text-purple-500" />
              </div>
              <Progress value={parseFloat(clickRate)} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium">Reply Rate</p>
                  <p className="text-3xl font-bold text-amber-700">{replyRate}%</p>
                </div>
                <Mail className="h-8 w-8 text-amber-500" />
              </div>
              <Progress value={parseFloat(replyRate)} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Bounce Rate</p>
                  <p className="text-3xl font-bold text-red-700">{bounceRate}%</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <Progress value={parseFloat(bounceRate)} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Campaign List */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Click on a campaign to view detailed analytics</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : campaigns && campaigns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Opened</TableHead>
                    <TableHead className="text-right">Clicked</TableHead>
                    <TableHead className="text-right">Replied</TableHead>
                    <TableHead className="text-right">Bounced</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const campaignOpenRate = campaign.sentCount ? ((campaign.openedCount || 0) / campaign.sentCount * 100).toFixed(1) : '0';
                    const campaignClickRate = campaign.openedCount ? ((campaign.clickedCount || 0) / campaign.openedCount * 100).toFixed(1) : '0';
                    
                    return (
                      <TableRow 
                        key={campaign.id} 
                        className={`cursor-pointer hover:bg-gray-50 ${selectedCampaign === campaign.id ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedCampaign(campaign.id)}
                      >
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <Badge variant={
                            campaign.status === 'sent' ? 'default' :
                            campaign.status === 'scheduled' ? 'secondary' :
                            campaign.status === 'draft' ? 'outline' : 'destructive'
                          }>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{campaign.sentCount || 0}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-green-600">{campaign.openedCount || 0}</span>
                          <span className="text-gray-400 text-xs ml-1">({campaignOpenRate}%)</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-purple-600">{campaign.clickedCount || 0}</span>
                          <span className="text-gray-400 text-xs ml-1">({campaignClickRate}%)</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-amber-600">{campaign.repliedCount || 0}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-red-600">{campaign.bouncedCount || 0}</span>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {campaign.sentAt ? format(new Date(campaign.sentAt), 'MMM d, yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No campaigns found</p>
                <Button 
                  className="mt-4"
                  onClick={() => setLocation("/recruiter/campaigns")}
                >
                  Create Your First Campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Campaign Analytics */}
        {selectedCampaign && analytics && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Detailed Analytics</CardTitle>
                <CardDescription>
                  Recipient-level engagement data for selected campaign
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchAnalytics()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : analytics.recipients && analytics.recipients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Clicked</TableHead>
                      <TableHead>Replied</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.recipients.map((recipient: any) => (
                      <TableRow key={recipient.id}>
                        <TableCell className="font-medium">{recipient.email}</TableCell>
                        <TableCell>
                          {recipient.bouncedAt ? (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Bounced
                            </Badge>
                          ) : recipient.openedAt ? (
                            <Badge className="bg-green-100 text-green-700 gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Engaged
                            </Badge>
                          ) : recipient.sentAt ? (
                            <Badge variant="secondary">Delivered</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {recipient.sentAt ? (
                            <span className="text-sm text-gray-600">
                              {format(new Date(recipient.sentAt), 'MMM d, h:mm a')}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {recipient.openedAt ? (
                            <span className="text-sm text-green-600">
                              {format(new Date(recipient.openedAt), 'MMM d, h:mm a')}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {recipient.clickedAt ? (
                            <span className="text-sm text-purple-600">
                              {format(new Date(recipient.clickedAt), 'MMM d, h:mm a')}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {recipient.repliedAt ? (
                            <span className="text-sm text-amber-600">
                              {format(new Date(recipient.repliedAt), 'MMM d, h:mm a')}
                            </span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-500 py-8">No recipient data available</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tips Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Tips to Improve Your Email Performance</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Improve Open Rates</p>
                  <p className="text-sm text-blue-600">Use personalized subject lines and send at optimal times (Tue-Thu, 10am-2pm)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MousePointer className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Boost Click Rates</p>
                  <p className="text-sm text-blue-600">Include clear CTAs and relevant content that matches the subject line</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium">Increase Replies</p>
                  <p className="text-sm text-blue-600">Ask specific questions and make it easy to respond with one-click options</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium">Reduce Bounces</p>
                  <p className="text-sm text-blue-600">Regularly clean your email list and verify addresses before sending</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
