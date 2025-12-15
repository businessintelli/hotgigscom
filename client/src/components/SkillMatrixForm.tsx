import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, AlertCircle } from "lucide-react";

interface SkillRequirement {
  id: number;
  skillName: string;
  isMandatory: boolean;
}

export interface SkillRating {
  skillRequirementId: number;
  skillName: string;
  rating: number;
  yearsExperience: number;
  lastUsedYear: number;
}

interface SkillMatrixFormProps {
  skillRequirements: SkillRequirement[];
  ratings: SkillRating[];
  onChange: (ratings: SkillRating[]) => void;
  showValidation?: boolean;
}

export default function SkillMatrixForm({
  skillRequirements,
  ratings,
  onChange,
  showValidation = false,
}: SkillMatrixFormProps) {
  const currentYear = new Date().getFullYear();

  // Initialize ratings for all skills
  useEffect(() => {
    if (skillRequirements.length > 0 && ratings.length === 0) {
      const initialRatings = skillRequirements.map((skill) => ({
        skillRequirementId: skill.id,
        skillName: skill.skillName,
        rating: 0,
        yearsExperience: 0,
        lastUsedYear: currentYear,
      }));
      onChange(initialRatings);
    }
  }, [skillRequirements]);

  const updateRating = (skillId: number, field: keyof SkillRating, value: number) => {
    const updated = ratings.map((r) =>
      r.skillRequirementId === skillId ? { ...r, [field]: value } : r
    );
    onChange(updated);
  };

  const getRatingForSkill = (skillId: number): SkillRating | undefined => {
    return ratings.find((r) => r.skillRequirementId === skillId);
  };

  const isSkillValid = (skill: SkillRequirement): boolean => {
    const rating = getRatingForSkill(skill.id);
    if (!skill.isMandatory) return true;
    return rating ? rating.rating > 0 && rating.yearsExperience > 0 : false;
  };

  const StarRating = ({ value, onChange: onStarChange }: { value: number; onChange: (v: number) => void }) => {
    const [hovered, setHovered] = useState(0);

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none transition-transform hover:scale-110"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onStarChange(star)}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hovered || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (skillRequirements.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-blue-600" />
          Skill Matrix
        </CardTitle>
        <CardDescription>
          Rate your proficiency in each skill, specify years of experience, and when you last used it.
          Fields marked as required must be completed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {skillRequirements.map((skill) => {
          const rating = getRatingForSkill(skill.id);
          const isValid = isSkillValid(skill);
          const showError = showValidation && !isValid && skill.isMandatory;

          return (
            <div
              key={skill.id}
              className={`p-4 rounded-lg border ${
                showError
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{skill.skillName}</span>
                  {skill.isMandatory ? (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  )}
                </div>
                {showError && (
                  <div className="flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Please complete this skill</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Proficiency Rating */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">
                    Proficiency (1-5)
                  </Label>
                  <StarRating
                    value={rating?.rating || 0}
                    onChange={(v) => updateRating(skill.id, "rating", v)}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {rating?.rating === 1 && "Beginner"}
                    {rating?.rating === 2 && "Elementary"}
                    {rating?.rating === 3 && "Intermediate"}
                    {rating?.rating === 4 && "Advanced"}
                    {rating?.rating === 5 && "Expert"}
                  </div>
                </div>

                {/* Years of Experience */}
                <div>
                  <Label htmlFor={`years-${skill.id}`} className="text-sm text-gray-600 mb-2 block">
                    Years of Experience
                  </Label>
                  <Input
                    id={`years-${skill.id}`}
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    placeholder="e.g., 3"
                    value={rating?.yearsExperience || ""}
                    onChange={(e) =>
                      updateRating(skill.id, "yearsExperience", parseFloat(e.target.value) || 0)
                    }
                    className="bg-white"
                  />
                </div>

                {/* Last Used Year */}
                <div>
                  <Label htmlFor={`lastUsed-${skill.id}`} className="text-sm text-gray-600 mb-2 block">
                    Last Used Year
                  </Label>
                  <Input
                    id={`lastUsed-${skill.id}`}
                    type="number"
                    min="1990"
                    max={currentYear}
                    placeholder={currentYear.toString()}
                    value={rating?.lastUsedYear || ""}
                    onChange={(e) =>
                      updateRating(skill.id, "lastUsedYear", parseInt(e.target.value) || currentYear)
                    }
                    className="bg-white"
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div className="text-sm text-gray-600 bg-gray-100 rounded-lg p-3">
          <p className="font-medium mb-1">Rating Guide:</p>
          <ul className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <li className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>Beginner</span>
            </li>
            <li className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>Elementary</span>
            </li>
            <li className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>Intermediate</span>
            </li>
            <li className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>Advanced</span>
            </li>
            <li className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>Expert</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Validation helper
export function validateSkillMatrix(
  skillRequirements: { id: number; skillName: string; isMandatory: boolean }[],
  ratings: SkillRating[]
): boolean {
  const mandatorySkills = skillRequirements.filter((s) => s.isMandatory);
  
  for (const skill of mandatorySkills) {
    const rating = ratings.find((r) => r.skillRequirementId === skill.id);
    if (!rating || rating.rating === 0 || rating.yearsExperience === 0) {
      return false;
    }
  }
  
  return true;
}
