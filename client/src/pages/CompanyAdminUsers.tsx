import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { UserPlus, Mail, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function CompanyAdminUsers() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: users, isLoading, refetch } = trpc.companyAdmin.getCompanyUsers.useQuery();
  const inviteUser = trpc.companyAdmin.inviteRecruiter.useMutation({
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "The recruiter has been invited to join your company.",
      });
      setDialogOpen(false);
      setInviteEmail("");
      setInviteName("");
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInvite = () => {
    if (!inviteEmail || !inviteName) {
      toast({
        title: "Missing information",
        description: "Please provide both name and email",
        variant: "destructive",
      });
      return;
    }
    inviteUser.mutate({ email: inviteEmail, name: inviteName });
  };

  return (
    <CompanyAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Members</h1>
            <p className="text-muted-foreground mt-2">
              Manage your recruitment team
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Recruiter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Recruiter</DialogTitle>
                <DialogDescription>
                  Send an invitation to add a new recruiter to your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={inviteUser.isPending}>
                  {inviteUser.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Team Members</CardTitle>
            <CardDescription>
              All recruiters in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : users && users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'company_admin' ? 'default' : 'secondary'}>
                          {user.role === 'company_admin' ? 'Admin' : 'Recruiter'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.emailVerified ? 'default' : 'outline'}>
                          {user.emailVerified ? 'Active' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled={user.role === 'company_admin'}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No team members yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Invite recruiters to start building your team
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CompanyAdminLayout>
  );
}
