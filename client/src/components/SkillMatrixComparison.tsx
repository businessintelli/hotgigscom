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
  Minus,
  Download,
  FileSpreadsheet,
  FileText
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
  const [isExporting, setIsExporting] = useState(false);

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

  // Export to Excel (CSV format)
  const exportToExcel = () => {
    if (!skillRequirements || selectedCandidates.length === 0) return;
    
    setIsExporting(true);
    try {
      // Build CSV content
      const headers = ['Skill', 'Required Rating', ...sortedSelectedCandidates.map(appId => {
        const candidate = candidates.find(c => (c.applicationId || c.id) === appId);
        return candidate?.name || 'Unknown';
      })];
      
      const rows = skillRequirements.map((skill: any) => {
        const row = [skill.skillName, skill.minimumRating];
        sortedSelectedCandidates.forEach(appId => {
          const rating = getSkillRating(appId, skill.skillName);
          if (rating) {
            row.push(`${rating.rating}/5 (${rating.yearsOfExperience}y exp, last: ${rating.lastUsedYear})`);
          } else {
            row.push('N/A');
          }
        });
        return row;
      });
      
      // Add overall scores row
      const scoresRow = ['Overall Score', '-', ...sortedSelectedCandidates.map(appId => `${calculateOverallScore(appId)}%`)];
      rows.push(scoresRow);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skill-matrix-comparison-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Skill matrix exported to Excel (CSV)');
    } catch (error) {
      toast.error('Failed to export skill matrix');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF (HTML-based)
  const exportToPDF = async () => {
    if (!skillRequirements || selectedCandidates.length === 0) return;
    
    setIsExporting(true);
    try {
      // Build HTML content for PDF
      const candidateHeaders = sortedSelectedCandidates.map((appId, index) => {
        const candidate = candidates.find(c => (c.applicationId || c.id) === appId);
        const score = calculateOverallScore(appId);
        return `<th style="text-align: center; padding: 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          ${index === 0 ? '⭐ ' : ''}${candidate?.name || 'Unknown'}<br/>
          <span style="font-size: 12px; color: #7c3aed;">Score: ${score}%</span>
        </th>`;
      }).join('');
      
      const tableRows = skillRequirements.map((skill: any) => {
        const cells = sortedSelectedCandidates.map(appId => {
          const rating = getSkillRating(appId, skill.skillName);
          if (rating) {
            const meetsReq = rating.rating >= skill.minimumRating;
            const color = rating.rating >= 4 ? '#22c55e' : rating.rating >= 3 ? '#eab308' : rating.rating >= 2 ? '#f97316' : '#ef4444';
            return `<td style="text-align: center; padding: 10px; border-bottom: 1px solid #e2e8f0;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="font-weight: 600; color: ${color};">${rating.rating}/5</span>
                  <span style="color: ${meetsReq ? '#22c55e' : '#ef4444'};">${meetsReq ? '✓' : '✗'}</span>
                </div>
                <span style="font-size: 11px; color: #64748b;">${rating.yearsOfExperience}y exp | ${rating.lastUsedYear}</span>
              </div>
            </td>`;
          }
          return `<td style="text-align: center; padding: 10px; border-bottom: 1px solid #e2e8f0; color: #94a3b8;">N/A</td>`;
        }).join('');
        
        return `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
            <strong>${skill.skillName}</strong><br/>
            <span style="font-size: 11px; color: #64748b;">Required: ${skill.minimumRating}/5</span>
          </td>
          ${cells}
        </tr>`;
      }).join('');
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Skill Matrix Comparison</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; }
            h1 { color: #1e293b; margin-bottom: 8px; }
            .subtitle { color: #64748b; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; }
            .legend { margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; }
            .legend-item { display: inline-block; margin-right: 16px; }
          </style>
        </head>
        <body>
          <h1>Skill Matrix Comparison Report</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <table>
            <thead>
              <tr>
                <th style="text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0;">Skill</th>
                ${candidateHeaders}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div class="legend">
            <strong>Legend:</strong>
            <span class="legend-item">⭐ Top Candidate</span>
            <span class="legend-item">✓ Meets Requirement</span>
            <span class="legend-item">✗ Below Requirement</span>
          </div>
        </body>
        </html>
      `;
      
      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
        toast.success('PDF ready for printing');
      } else {
        toast.error('Please allow popups to export PDF');
      }
    } catch (error) {
      toast.error('Failed to export skill matrix');
    } finally {
      setIsExporting(false);
    }
  };

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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Skill Comparison Matrix
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToExcel}
                        disabled={isExporting}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        {isExporting ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4 mr-1" />
                        )}
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToPDF}
                        disabled={isExporting}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {isExporting ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4 mr-1" />
                        )}
                        PDF
                      </Button>
                    </div>
                  </div>
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
