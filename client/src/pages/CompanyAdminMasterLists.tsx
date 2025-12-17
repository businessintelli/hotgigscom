import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Search, Users, Briefcase, Award, Download, Eye } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export function CompanyAdminMasterLists() {
  const [candidateSearch, setCandidateSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [associateSearch, setAssociateSearch] = useState("");

  const { data: candidates, isLoading: loadingCandidates } =
    trpc.companyAdmin.getCompanyCandidates.useQuery({
      search: candidateSearch,
      limit: 50,
    });

  const { data: jobs, isLoading: loadingJobs } =
    trpc.companyAdmin.getCompanyJobs.useQuery({
      search: jobSearch,
      limit: 50,
    });

  const { data: associates, isLoading: loadingAssociates } =
    trpc.companyAdmin.getCompanyAssociates.useQuery({
      search: associateSearch,
      limit: 50,
    });

  return (
    <CompanyAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Master Lists</h1>
          <p className="text-muted-foreground mt-2">
            Company-wide view of all candidates, jobs, and placements
          </p>
        </div>

        <Tabs defaultValue="candidates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="candidates">
              <Users className="h-4 w-4 mr-2" />
              All Candidates
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="h-4 w-4 mr-2" />
              All Jobs
            </TabsTrigger>
            <TabsTrigger value="associates">
              <Award className="h-4 w-4 mr-2" />
              Associates (Placed)
            </TabsTrigger>
          </TabsList>

          {/* Candidates Tab */}
          <TabsContent value="candidates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Candidates</CardTitle>
                    <CardDescription>
                      Union of all candidates across all recruiters
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search candidates by name, email, skills..."
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCandidates ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Loading candidates...
                  </p>
                ) : candidates && candidates.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Recruiter</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates.map((candidate: any) => (
                        <TableRow key={candidate.id}>
                          <TableCell className="font-medium">
                            {candidate.candidateName}
                          </TableCell>
                          <TableCell>{candidate.candidateEmail}</TableCell>
                          <TableCell>{candidate.title || "—"}</TableCell>
                          <TableCell>
                            {candidate.yearsOfExperience
                              ? `${candidate.yearsOfExperience} years`
                              : "—"}
                          </TableCell>
                          <TableCell>{candidate.location || "—"}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {candidate.recruiterName}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/recruiter/candidate-resume/${candidate.resumeProfileId}`}
                            >
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No candidates found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {candidateSearch
                        ? "Try adjusting your search"
                        : "Candidates will appear here once recruiters add them"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Jobs</CardTitle>
                    <CardDescription>
                      All job postings created by your recruitment team
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search jobs by title, company, location..."
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Loading jobs...
                  </p>
                ) : jobs && jobs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applications</TableHead>
                        <TableHead>Recruiter</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job: any) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.title}</TableCell>
                          <TableCell>{job.companyName || "—"}</TableCell>
                          <TableCell>{job.location}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{job.employmentType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={job.status === "active" ? "default" : "secondary"}
                            >
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{job.applicationCount || 0}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {job.recruiterName}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/recruiter/jobs/${job.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No jobs found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {jobSearch
                        ? "Try adjusting your search"
                        : "Jobs will appear here once recruiters post them"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Associates Tab */}
          <TabsContent value="associates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Associates (Placed Candidates)</CardTitle>
                    <CardDescription>
                      All successfully placed candidates across the company
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search associates by name, company, position..."
                      value={associateSearch}
                      onChange={(e) => setAssociateSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAssociates ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Loading associates...
                  </p>
                ) : associates && associates.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Placed By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {associates.map((associate: any) => (
                        <TableRow key={associate.id}>
                          <TableCell className="font-medium">
                            {associate.candidateName}
                          </TableCell>
                          <TableCell>{associate.candidateEmail}</TableCell>
                          <TableCell>{associate.jobTitle}</TableCell>
                          <TableCell>{associate.companyName || "—"}</TableCell>
                          <TableCell>
                            {associate.startDate
                              ? new Date(associate.startDate).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {associate.recruiterName}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No associates found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {associateSearch
                        ? "Try adjusting your search"
                        : "Associates will appear here once candidates are successfully placed"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CompanyAdminLayout>
  );
}
