import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ExternalLink, FileText, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CompanyAdminCandidates() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");

  const { data, isLoading } = trpc.companyAdmin.getCompanyCandidates.useQuery({
    page,
    pageSize: 20,
    search: search || undefined,
    skills: skills || undefined,
    location: location || undefined,
  });

  return (
    <CompanyAdminLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Company Candidates</h1>
          <p className="text-muted-foreground">
            View all unique candidates who have applied to jobs in your company
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Input
                placeholder="Filter by skills..."
                value={skills}
                onChange={(e) => {
                  setSkills(e.target.value);
                  setPage(1);
                }}
              />

              <Input
                placeholder="Filter by location..."
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading candidates...
              </div>
            ) : !data?.data || data.data.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No candidates found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Applications</TableHead>
                        <TableHead>Last Applied</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.data.map((item: any) => {
                        const skillsList = item.candidate.skills
                          ? JSON.parse(item.candidate.skills)
                          : [];
                        const displaySkills = Array.isArray(skillsList)
                          ? skillsList.slice(0, 3)
                          : [];

                        return (
                          <TableRow key={item.candidate.id}>
                            <TableCell className="font-medium">
                              {item.user.name || "Unknown"}
                            </TableCell>
                            <TableCell>{item.user.email}</TableCell>
                            <TableCell>
                              {item.candidate.title || "Not specified"}
                            </TableCell>
                            <TableCell>
                              {item.candidate.location || "Not specified"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {displaySkills.map((skill: string, idx: number) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {skillsList.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{skillsList.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.applicationCount || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.latestApplication
                                ? new Date(item.latestApplication).toLocaleDateString()
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                >
                                  <a href={`mailto:${item.user.email}`}>
                                    <Mail className="h-4 w-4" />
                                  </a>
                                </Button>
                                {item.candidate.resumeUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                  >
                                    <a
                                      href={item.candidate.resumeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="View Resume"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                >
                                  <a
                                    href={`/candidate-profile/${item.candidate.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {data.pagination && data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {data.pagination.from} to {data.pagination.to} of{" "}
                      {data.pagination.total} candidates
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === data.pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </CompanyAdminLayout>
  );
}
