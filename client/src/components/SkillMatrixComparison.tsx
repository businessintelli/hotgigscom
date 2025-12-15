import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { 
  BarChart3, 
  Loader2, 
  Star, 
  User, 
  X,
  Check,
  Minus
} from "lucide-react";
import { toast } from "sonner";

interface Candidate {
  id: number;
  name: string;
  applicationId?: number;
}

interface SkillMatrixComparisonProps {
  jobId: number;
  candidates: Candidate[];
  trigger?: React.ReactNode;
}

interface SkillRating {
  skillName: string;
  rating: number;
  yearsOfExperience: number;
  lastUsedYear: number;
}

export function SkillMatrixComparison({
  jobId,
  candidates,
  trigger,
}: SkillMatrixComparisonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);

  // Fetch skill requirements for the job
  const { data: skillRequirements } = (trpc as any).skillMatrix?.getJobRequirements?.useQuery(
    { jobId },
    { enabled: isOpen }
  ) || { data: null };

  // Fetch skill ratings for all selected candidates
  const { data: candidateRatings, isLoading } = (trpc as any).skillMatrix?.getCandidateRatingsForJob?.useQuery(
    { jobId, applicationIds: selectedCandidates },
    { enabled: isOpen && selectedCandidates.length > 0 }
  ) || { data: null, isLoading: false };

  const toggleCandidate = (candidateId: number) => {
    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      }
      if (prev.length >= 5) {
        toast.error("You can compare up to 5 candidates at a time");
        return prev;
      }
      return [...prev, candidateId];
    });
  };

  const getCandidateRatings = (applicationId: number): SkillRating[] => {
    if (!candidateRatings) return [];
    return candidateRatings.filter((r: any) => r.applicationId === applicationId) || [];
  };

  const getSkillRating = (applicationId: number, skillName: string): SkillRating | undefined => {
    const ratings = getCandidateRatings(applicationId);
    return ratings.find((r: SkillRating) => r.skillName === skillName);
  };

  const renderRatingBar = (rating: number, maxRating: number = 5) => {
    const percentage = (rating / maxRating) * 100;
    let colorClass = "bg-red-500";
    if (rating >= 4) colorClass = "bg-green-500";
    else if (rating >= 3) colorClass = "bg-yellow-500";
    else if (rating >= 2) colorClass = "bg-orange-500";

    return (
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colorClass} transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium w-6">{rating}</span>
      </div>
    );
  };

  const renderExperienceIndicator = (years: number) => {
    let colorClass = "text-gray-500";
    if (years >= 5) colorClass = "text-green-600";
    else if (years >= 3) colorClass = "text-blue-600";
    else if (years >= 1) colorClass = "text-yellow-600";

    return (
      <span className={`text-sm font-medium ${colorClass}`}>
        {years}y
      </span>
    );
  };

  const renderLastUsedIndicator = (year: number) => {
    const currentYear = new Date().getFullYear();
    const diff = currentYear - year;
    
    if (diff === 0) {
      return <Badge className="bg-green-100 text-green-800 text-xs">Current</Badge>;
    } else if (diff <= 1) {
      return <Badge className="bg-blue-100 text-blue-800 text-xs">{year}</Badge>;
    } else if (diff <= 3) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">{year}</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 text-xs">{year}</Badge>;
    }
  };

  const calculateOverallScore = (applicationId: number): number => {
    const ratings = getCandidateRatings(applicationId);
    if (!ratings.length) return 0;
    
    const totalScore = ratings.reduce((sum: number, r: SkillRating) => {
      // Weight: rating (50%) + experience (30%) + recency (20%)
      const ratingScore = (r.rating / 5) * 50;
      const expScore = Math.min(r.yearsOfExperience / 10, 1) * 30;
      const currentYear = new Date().getFullYear();
      const recencyScore = Math.max(0, 1 - (currentYear - r.lastUsedYear) / 5) * 20;
      return sum + ratingScore + expScore + recencyScore;
    }, 0);
    
    return Math.round(totalScore / ratings.length);
  };

  const sortedSelectedCandidates = [...selectedCandidates].sort((a, b) => {
    return calculateOverallScore(b) - calculateOverallScore(a);
  });

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="text-purple-600 border-purple-300 hover:bg-purple-50"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Compare Skill Matrices
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Skill Matrix Comparison
            </DialogTitle>
            <DialogDescription>
              Select candidates to compare their skill ratings side by side
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Candidate Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Select Candidates to Compare (max 5)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedCandidates.includes(candidate.applicationId || candidate.id)
                          ? "bg-purple-50 border-purple-300"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => toggleCandidate(candidate.applicationId || candidate.id)}
                    >
                      <Checkbox
                        checked={selectedCandidates.includes(candidate.applicationId || candidate.id)}
                        onCheckedChange={() => toggleCandidate(candidate.applicationId || candidate.id)}
                      />
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{candidate.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comparison Table */}
            {selectedCandidates.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Skill Comparison Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-3 border-b font-medium text-gray-700">
                              Skill
                            </th>
                            {sortedSelectedCandidates.map((appId, index) => {
                              const candidate = candidates.find(
                                c => (c.applicationId || c.id) === appId
                              );
                              return (
                                <th
                                  key={appId}
                                  className="text-center p-3 border-b font-medium text-gray-700 min-w-[150px]"
                                >
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-2">
                                      {index === 0 && (
                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                      )}
                                      <span>{candidate?.name || "Unknown"}</span>
                                    </div>
                                    <Badge className="bg-purple-100 text-purple-800 text-xs">
                                      Score: {calculateOverallScore(appId)}%
                                    </Badge>
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {skillRequirements?.map((skill: any) => (
                            <tr key={skill.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="flex flex-col">
                                  <span className="font-medium">{skill.skillName}</span>
                                  <span className="text-xs text-gray-500">
                                    Required: {skill.minimumRating}/5
                                  </span>
                                </div>
                              </td>
                              {sortedSelectedCandidates.map((appId) => {
                                const rating = getSkillRating(appId, skill.skillName);
                                const meetsRequirement = rating && rating.rating >= skill.minimumRating;
                                
                                return (
                                  <td key={appId} className="p-3 text-center">
                                    {rating ? (
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-2">
                                          {renderRatingBar(rating.rating)}
                                          {meetsRequirement ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                          ) : (
                                            <X className="h-4 w-4 text-red-500" />
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <span>Exp: {renderExperienceIndicator(rating.yearsOfExperience)}</span>
                                          {renderLastUsedIndicator(rating.lastUsedYear)}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-1 text-gray-400">
                                        <Minus className="h-4 w-4" />
                                        <span className="text-sm">N/A</span>
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            {selectedCandidates.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Rating:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span>4-5</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-yellow-500" />
                        <span>3</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-orange-500" />
                        <span>2</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-500" />
                        <span>1</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Last Used:</span>
                      <Badge className="bg-green-100 text-green-800 text-xs">Current</Badge>
                      <Badge className="bg-blue-100 text-blue-800 text-xs">1y ago</Badge>
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">2-3y ago</Badge>
                      <Badge className="bg-red-100 text-red-800 text-xs">4+ y ago</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedCandidates.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Select at least 2 candidates to compare their skill matrices</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
