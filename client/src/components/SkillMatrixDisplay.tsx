import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Award, Calendar, Clock } from "lucide-react";

interface SkillRating {
  id: number;
  skillRequirementId: number;
  skillName: string;
  rating: number;
  yearsExperience: number;
  lastUsedYear: number;
}

interface SkillMatrixDisplayProps {
  ratings: SkillRating[];
  compact?: boolean;
}

export default function SkillMatrixDisplay({ ratings, compact = false }: SkillMatrixDisplayProps) {
  if (!ratings || ratings.length === 0) {
    return null;
  }

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return "Beginner";
      case 2: return "Elementary";
      case 3: return "Intermediate";
      case 4: return "Advanced";
      case 5: return "Expert";
      default: return "Not Rated";
    }
  };

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1: return "bg-gray-100 text-gray-700";
      case 2: return "bg-blue-100 text-blue-700";
      case 3: return "bg-green-100 text-green-700";
      case 4: return "bg-purple-100 text-purple-700";
      case 5: return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const StarRating = ({ value }: { value: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= value
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Award className="h-4 w-4 text-blue-600" />
          Skill Matrix
        </h4>
        <div className="flex flex-wrap gap-2">
          {ratings.map((skill) => (
            <Badge
              key={skill.id}
              variant="outline"
              className={`${getRatingColor(skill.rating)} border-0`}
            >
              {skill.skillName} ({skill.rating}/5)
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-600" />
          Skill Matrix
        </CardTitle>
        <CardDescription>
          Candidate's self-assessed skills with experience details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Skill</th>
                <th className="text-center py-2 px-3 text-sm font-semibold text-gray-600">Proficiency</th>
                <th className="text-center py-2 px-3 text-sm font-semibold text-gray-600">Experience</th>
                <th className="text-center py-2 px-3 text-sm font-semibold text-gray-600">Last Used</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((skill) => (
                <tr key={skill.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <span className="font-medium">{skill.skillName}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col items-center gap-1">
                      <StarRating value={skill.rating} />
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRatingColor(skill.rating)}`}>
                        {getRatingLabel(skill.rating)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-700">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{skill.yearsExperience} {skill.yearsExperience === 1 ? 'year' : 'years'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{skill.lastUsedYear}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {(ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)}
            </p>
            <p className="text-xs text-gray-600">Avg Rating</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {ratings.reduce((sum, r) => sum + r.yearsExperience, 0)}
            </p>
            <p className="text-xs text-gray-600">Total Years</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {ratings.filter(r => r.rating >= 4).length}
            </p>
            <p className="text-xs text-gray-600">Expert Skills</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// PDF-friendly version for export
export function SkillMatrixPDFContent({ ratings }: { ratings: SkillRating[] }) {
  if (!ratings || ratings.length === 0) {
    return '<p>No skill matrix data available</p>';
  }

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return "Beginner";
      case 2: return "Elementary";
      case 3: return "Intermediate";
      case 4: return "Advanced";
      case 5: return "Expert";
      default: return "Not Rated";
    }
  };

  const getStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return `
    <div style="margin-top: 20px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
      <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #1f2937;">
        📊 Skill Matrix
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">Skill</th>
            <th style="text-align: center; padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">Rating</th>
            <th style="text-align: center; padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">Experience</th>
            <th style="text-align: center; padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">Last Used</th>
          </tr>
        </thead>
        <tbody>
          ${ratings.map(skill => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${skill.skillName}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                <span style="color: #fbbf24;">${getStars(skill.rating)}</span>
                <br/>
                <span style="font-size: 11px; color: #6b7280;">${getRatingLabel(skill.rating)}</span>
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${skill.yearsExperience} years</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${skill.lastUsedYear}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
