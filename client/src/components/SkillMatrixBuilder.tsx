import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, GripVertical, Star } from "lucide-react";

export interface SkillRequirement {
  skillName: string;
  isMandatory: boolean;
}

interface SkillMatrixBuilderProps {
  skills: SkillRequirement[];
  onChange: (skills: SkillRequirement[]) => void;
  maxSkills?: number;
}

export default function SkillMatrixBuilder({ 
  skills, 
  onChange, 
  maxSkills = 10 
}: SkillMatrixBuilderProps) {
  const [newSkill, setNewSkill] = useState("");

  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.length >= maxSkills) {
      return;
    }
    if (skills.some(s => s.skillName.toLowerCase() === newSkill.toLowerCase())) {
      return;
    }
    
    onChange([...skills, { skillName: newSkill.trim(), isMandatory: true }]);
    setNewSkill("");
  };

  const removeSkill = (index: number) => {
    const updated = skills.filter((_, i) => i !== index);
    onChange(updated);
  };

  const toggleMandatory = (index: number) => {
    const updated = skills.map((skill, i) => 
      i === index ? { ...skill, isMandatory: !skill.isMandatory } : skill
    );
    onChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-blue-600" />
          Skill Matrix Requirements
        </CardTitle>
        <CardDescription>
          Define the skills candidates must rate themselves on when applying. 
          Candidates will provide their proficiency (1-5), years of experience, and last used year for each skill.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add skill input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter a skill (e.g., React, Python, AWS)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white"
          />
          <Button 
            type="button" 
            onClick={addSkill}
            disabled={skills.length >= maxSkills || !newSkill.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Skills list */}
        {skills.length > 0 ? (
          <div className="space-y-2">
            {skills.map((skill, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm"
              >
                <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-medium">{skill.skillName}</span>
                  {skill.isMandatory ? (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor={`mandatory-${index}`} className="text-sm text-gray-600">
                    Mandatory
                  </Label>
                  <Switch
                    id={`mandatory-${index}`}
                    checked={skill.isMandatory}
                    onCheckedChange={() => toggleMandatory(index)}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSkill(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No skills added yet</p>
            <p className="text-sm">Add skills that candidates should rate themselves on</p>
          </div>
        )}

        {/* Info */}
        <div className="text-sm text-gray-600 bg-gray-100 rounded-lg p-3">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Candidates will rate each skill from 1-5 stars</li>
            <li>They'll specify years of experience with each skill</li>
            <li>They'll indicate when they last used each skill</li>
            <li>Required skills must be filled before submitting application</li>
            <li>This skill matrix will be shared with the customer along with the resume</li>
          </ul>
        </div>

        {skills.length >= maxSkills && (
          <p className="text-sm text-amber-600">
            Maximum of {maxSkills} skills reached
          </p>
        )}
      </CardContent>
    </Card>
  );
}
