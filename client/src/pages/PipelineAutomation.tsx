import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Zap, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

type AutomationRule = {
  id: string;
  name: string;
  enabled: boolean;
  condition: {
    type: "score" | "time";
    field?: string;
    operator?: string;
    value?: number;
  };
  action: {
    type: "move_stage";
    targetStage: string;
  };
};

const STAGES = [
  { value: "pending", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview_scheduled", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

const SCORE_FIELDS = [
  { value: "overallScore", label: "Overall Score" },
  { value: "domainScore", label: "Domain Match Score" },
  { value: "skillScore", label: "Skill Match Score" },
  { value: "experienceScore", label: "Experience Score" },
];

export default function PipelineAutomation() {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: "1",
      name: "Auto-advance high scorers",
      enabled: true,
      condition: {
        type: "score",
        field: "overallScore",
        operator: ">=",
        value: 80,
      },
      action: {
        type: "move_stage",
        targetStage: "screening",
      },
    },
    {
      id: "2",
      name: "Auto-reject low scorers",
      enabled: false,
      condition: {
        type: "score",
        field: "overallScore",
        operator: "<",
        value: 40,
      },
      action: {
        type: "move_stage",
        targetStage: "rejected",
      },
    },
  ]);

  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    name: "",
    enabled: true,
    condition: {
      type: "score",
      field: "overallScore",
      operator: ">=",
      value: 70,
    },
    action: {
      type: "move_stage",
      targetStage: "screening",
    },
  });

  const handleToggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
    toast.success("Rule updated");
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
    toast.success("Rule deleted");
  };

  const handleAddRule = () => {
    if (!newRule.name) {
      toast.error("Please enter a rule name");
      return;
    }

    const rule: AutomationRule = {
      id: Date.now().toString(),
      name: newRule.name,
      enabled: newRule.enabled || true,
      condition: newRule.condition as any,
      action: newRule.action as any,
    };

    setRules([...rules, rule]);
    setNewRule({
      name: "",
      enabled: true,
      condition: {
        type: "score",
        field: "overallScore",
        operator: ">=",
        value: 70,
      },
      action: {
        type: "move_stage",
        targetStage: "screening",
      },
    });
    toast.success("Rule created");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8 text-yellow-500" />
          Pipeline Automation
        </h1>
        <p className="text-muted-foreground mt-2">
          Create rules to automatically move candidates through your pipeline
        </p>
      </div>

      {/* Existing Rules */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Active Rules</CardTitle>
          <CardDescription>
            Manage your automation rules. Rules are evaluated when applications are submitted or updated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map(rule => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => handleToggleRule(rule.id)}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{rule.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rule.condition.type === "score" && (
                        <>
                          When {SCORE_FIELDS.find(f => f.value === rule.condition.field)?.label}{" "}
                          {rule.condition.operator} {rule.condition.value}%
                        </>
                      )}
                      {rule.condition.type === "time" && (
                        <>
                          After {rule.condition.value} hours in current stage
                        </>
                      )}
                      {" → "}
                      Move to {STAGES.find(s => s.value === rule.action.targetStage)?.label}
                    </p>
                  </div>
                  <Badge variant={rule.enabled ? "default" : "secondary"}>
                    {rule.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}

            {rules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No automation rules yet. Create your first rule below.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create New Rule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Rule
          </CardTitle>
          <CardDescription>
            Set up a new automation rule to streamline your hiring process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input
                id="rule-name"
                placeholder="e.g., Auto-advance high scorers"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="condition-field">Score Type</Label>
                <Select
                  value={newRule.condition?.field}
                  onValueChange={(value) =>
                    setNewRule({
                      ...newRule,
                      condition: { ...newRule.condition!, field: value },
                    })
                  }
                >
                  <SelectTrigger id="condition-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCORE_FIELDS.map(field => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition-operator">Operator</Label>
                <Select
                  value={newRule.condition?.operator}
                  onValueChange={(value) =>
                    setNewRule({
                      ...newRule,
                      condition: { ...newRule.condition!, operator: value },
                    })
                  }
                >
                  <SelectTrigger id="condition-operator">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=">=">&gt;= (Greater than or equal)</SelectItem>
                    <SelectItem value=">">&gt; (Greater than)</SelectItem>
                    <SelectItem value="<=">&lt;= (Less than or equal)</SelectItem>
                    <SelectItem value="<">&lt; (Less than)</SelectItem>
                    <SelectItem value="==">=== (Equal to)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition-value">Score Threshold (%)</Label>
                <Input
                  id="condition-value"
                  type="number"
                  min="0"
                  max="100"
                  value={newRule.condition?.value}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      condition: {
                        ...newRule.condition!,
                        value: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-stage">Move to Stage</Label>
              <Select
                value={newRule.action?.targetStage}
                onValueChange={(value) =>
                  setNewRule({
                    ...newRule,
                    action: { ...newRule.action!, targetStage: value },
                  })
                }
              >
                <SelectTrigger id="action-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <p className="font-medium mb-1">Preview</p>
              <p>
                When a candidate's {SCORE_FIELDS.find(f => f.value === newRule.condition?.field)?.label}{" "}
                is {newRule.condition?.operator} {newRule.condition?.value}%,
                automatically move them to {STAGES.find(s => s.value === newRule.action?.targetStage)?.label} stage.
              </p>
            </div>

            <Button onClick={handleAddRule} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
