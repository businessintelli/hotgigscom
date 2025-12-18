import * as db from "../db";

interface AutomationAnalytics {
  sourcing: {
    totalCandidates: number;
    costPerCandidate: number;
    conversionRate: number;
    trend: "up" | "down" | "stable";
    trendPercent: number;
    monthlyData: Array<{
      month: string;
      sourced: number;
      applied: number;
      hired: number;
    }>;
    channelBreakdown: Array<{
      name: string;
      value: number;
      costPerHire: number;
    }>;
  };
  email: {
    totalCampaigns: number;
    totalRecipients: number;
    openRate: number;
    replyRate: number;
    clickRate: number;
    monthlyData: Array<{
      month: string;
      openRate: number;
      clickRate: number;
      replyRate: number;
    }>;
  };
  autoScheduling: {
    totalScheduled: number;
    completed: number;
    attendanceRate: number;
    monthlyData: Array<{
      month: string;
      scheduled: number;
      completed: number;
      noShow: number;
    }>;
  };
  predictions: {
    accuracy: number;
    totalPredictions: number;
    improving: boolean;
    monthlyData: Array<{
      month: string;
      accuracy: number;
      precision: number;
      recall: number;
    }>;
  };
  insights: Array<{
    type: "success" | "warning" | "info";
    title: string;
    description: string;
    action?: string;
  }>;
}

export async function getAutomationAnalytics(recruiterId: number, days: number): Promise<AutomationAnalytics> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // TODO: Replace with actual database queries when automation features are implemented
  // For now, using mock data to demonstrate the dashboard
  
  // Mock sourcing metrics
  const totalSourced = 127;
  const totalApplied = 45;
  const totalHired = 8;
  const conversionRate = totalSourced > 0 ? ((totalHired / totalSourced) * 100) : 0;
  const costPerCandidate = 85;

  // Mock email metrics
  const totalRecipients = 450;
  const totalOpened = 189;
  const totalClicked = 67;
  const totalReplied = 23;
  const openRate = totalRecipients > 0 ? ((totalOpened / totalRecipients) * 100) : 0;
  const clickRate = totalRecipients > 0 ? ((totalClicked / totalRecipients) * 100) : 0;
  const replyRate = totalRecipients > 0 ? ((totalReplied / totalRecipients) * 100) : 0;

  // Mock auto-scheduling metrics
  const totalScheduled = 56;
  const completed = 42;
  const noShow = 6;
  const attendanceRate = totalScheduled > 0 ? (((totalScheduled - noShow) / totalScheduled) * 100) : 0;

  // Mock prediction metrics
  const totalPredictions = 234;
  const correctPredictions = 187;
  const accuracy = totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100) : 0;

  // Generate monthly data (last 6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(date.toLocaleString('default', { month: 'short' }));
  }

  // Mock monthly data (in production, this would query actual monthly aggregates)
  const sourcingMonthlyData = months.map((month, idx) => ({
    month,
    sourced: Math.floor(totalSourced / 6) + (idx * 2),
    applied: Math.floor(totalApplied / 6) + idx,
    hired: Math.floor(totalHired / 6)
  }));

  const emailMonthlyData = months.map((month) => ({
    month,
    openRate: openRate + (Math.random() * 10 - 5),
    clickRate: clickRate + (Math.random() * 5 - 2.5),
    replyRate: replyRate + (Math.random() * 3 - 1.5)
  }));

  const schedulingMonthlyData = months.map((month, idx) => ({
    month,
    scheduled: Math.floor(totalScheduled / 6) + idx,
    completed: Math.floor(completed / 6) + idx,
    noShow: Math.floor(noShow / 6)
  }));

  const predictionMonthlyData = months.map((month, idx) => ({
    month,
    accuracy: accuracy + (idx * 2), // Shows improving trend
    precision: accuracy - 5 + (idx * 1.5),
    recall: accuracy + 5 + (idx * 1)
  }));

  // Channel breakdown
  const channelBreakdown = [
    { name: "LinkedIn", value: Math.floor(totalSourced * 0.45), costPerHire: 1200 },
    { name: "GitHub", value: Math.floor(totalSourced * 0.25), costPerHire: 800 },
    { name: "Referrals", value: Math.floor(totalSourced * 0.15), costPerHire: 500 },
    { name: "Job Boards", value: Math.floor(totalSourced * 0.10), costPerHire: 1500 },
    { name: "Direct", value: Math.floor(totalSourced * 0.05), costPerHire: 300 }
  ];

  // Generate insights
  const insights = [];
  
  if (openRate > 30) {
    insights.push({
      type: "success" as const,
      title: "Excellent Email Engagement",
      description: `Your email open rate of ${openRate.toFixed(1)}% is above industry average. Continue using personalized subject lines and AI-enhanced content.`,
      action: "View top performing templates"
    });
  }
  
  if (attendanceRate < 70) {
    insights.push({
      type: "warning" as const,
      title: "Interview Attendance Needs Improvement",
      description: `${attendanceRate.toFixed(1)}% attendance rate is below target. Consider sending more reminder emails and confirming availability before scheduling.`,
      action: "Update reminder settings"
    });
  }
  
  if (accuracy > 75) {
    insights.push({
      type: "success" as const,
      title: "High Prediction Accuracy",
      description: `Your AI model is ${accuracy.toFixed(1)}% accurate in predicting candidate success. This helps you focus on the best candidates first.`,
      action: "View prediction details"
    });
  }
  
  if (conversionRate < 5) {
    insights.push({
      type: "info" as const,
      title: "Optimize Sourcing Channels",
      description: `Only ${conversionRate.toFixed(1)}% of sourced candidates are being hired. Focus on LinkedIn and GitHub which have higher conversion rates.`,
      action: "Adjust sourcing strategy"
    });
  }

  return {
    sourcing: {
      totalCandidates: totalSourced,
      costPerCandidate: Math.round(costPerCandidate),
      conversionRate: Math.round(conversionRate * 10) / 10,
      trend: totalSourced > 50 ? "up" : totalSourced < 20 ? "down" : "stable",
      trendPercent: 12,
      monthlyData: sourcingMonthlyData,
      channelBreakdown
    },
    email: {
      totalCampaigns: emailCampaigns.length,
      totalRecipients,
      openRate: Math.round(openRate * 10) / 10,
      replyRate: Math.round(replyRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      monthlyData: emailMonthlyData
    },
    autoScheduling: {
      totalScheduled,
      completed,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      monthlyData: schedulingMonthlyData
    },
    predictions: {
      accuracy: Math.round(accuracy * 10) / 10,
      totalPredictions,
      improving: accuracy > 70,
      monthlyData: predictionMonthlyData
    },
    insights
  };
}
