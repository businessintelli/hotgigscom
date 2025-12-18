import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, DollarSign, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CompanyBudgetSettings() {
  const { toast } = useToast();
  const [monthlyLimit, setMonthlyLimit] = useState<string>("500");
  const [alertThreshold, setAlertThreshold] = useState<string>("80");
  const [gracePeriodHours, setGracePeriodHours] = useState<string>("24");

  // Get current user's company ID (assuming it's available in context)
  const { data: user } = trpc.auth.me.useQuery();
  const companyId = user?.companyId || 0;

  // Get budget status
  const { data: budgetStatus, isLoading, refetch } = trpc.budgetManagement.getBudgetStatus.useQuery(
    { companyId },
    { enabled: !!companyId }
  );

  // Configure budget mutation
  const configureBudget = trpc.budgetManagement.configureBudget.useMutation({
    onSuccess: () => {
      toast({
        title: "Budget Updated",
        description: "Your AI budget settings have been saved successfully.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize form with current values
  useState(() => {
    if (budgetStatus) {
      setMonthlyLimit(budgetStatus.monthlyLimit.toString());
      setAlertThreshold("80"); // Default if not in response
      setGracePeriodHours("24"); // Default if not in response
    }
  });

  const handleSave = () => {
    configureBudget.mutate({
      companyId,
      monthlyLimit: parseFloat(monthlyLimit),
      alertThreshold: parseFloat(alertThreshold),
      gracePeriodHours: parseInt(gracePeriodHours),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const percentageUsed = budgetStatus?.percentageUsed || 0;
  const isOverBudget = budgetStatus?.isOverBudget || false;
  const isPaused = budgetStatus?.isPaused || false;

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Budget Management</h1>
        <p className="text-muted-foreground mt-2">
          Configure spending limits and alerts for AI features
        </p>
      </div>

      {/* Current Budget Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Budget Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isPaused && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  AI features are currently paused due to budget limit exceeded.
                </AlertDescription>
              </Alert>
            )}

            {isOverBudget && !isPaused && budgetStatus?.gracePeriodRemaining && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Budget limit exceeded. Grace period remaining: {budgetStatus.gracePeriodRemaining.toFixed(1)} hours
                </AlertDescription>
              </Alert>
            )}

            {!isOverBudget && percentageUsed >= 80 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You've used {percentageUsed.toFixed(1)}% of your monthly budget.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Current Spending</Label>
                <p className="text-2xl font-bold">
                  ${budgetStatus?.currentSpending.toFixed(2) || "0.00"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Monthly Limit</Label>
                <p className="text-2xl font-bold">
                  ${budgetStatus?.monthlyLimit.toFixed(2) || "500.00"}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label>Budget Usage</Label>
                <span className="text-sm font-medium">{percentageUsed.toFixed(1)}%</span>
              </div>
              <Progress 
                value={percentageUsed} 
                className={percentageUsed >= 100 ? "bg-red-100" : percentageUsed >= 80 ? "bg-yellow-100" : ""}
              />
            </div>

            {budgetStatus?.overrideEnabled && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Budget override is enabled by administrator. AI features are unrestricted.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Configuration</CardTitle>
          <CardDescription>
            Set monthly spending limits and configure alert thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="monthlyLimit">Monthly Budget Limit ($)</Label>
              <Input
                id="monthlyLimit"
                type="number"
                min="0"
                step="50"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="500"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Maximum AI spending allowed per month
              </p>
            </div>

            <div>
              <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
              <Input
                id="alertThreshold"
                type="number"
                min="0"
                max="100"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                placeholder="80"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Receive email alerts when spending reaches this percentage
              </p>
            </div>

            <div>
              <Label htmlFor="gracePeriodHours">Grace Period (hours)</Label>
              <Input
                id="gracePeriodHours"
                type="number"
                min="0"
                step="1"
                value={gracePeriodHours}
                onChange={(e) => setGracePeriodHours(e.target.value)}
                placeholder="24"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Time allowed to continue using AI features after exceeding budget
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={configureBudget.isPending}
              className="w-full"
            >
              {configureBudget.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Budget Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How Budget Enforcement Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Email alerts are sent when spending reaches the alert threshold</li>
            <li>• When budget is exceeded, a grace period begins before AI features are paused</li>
            <li>• During grace period, you can increase the budget limit or wait for monthly reset</li>
            <li>• After grace period expires, AI features are automatically paused</li>
            <li>• Budgets reset automatically at the start of each month</li>
            <li>• Administrators can enable override to bypass budget limits temporarily</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
