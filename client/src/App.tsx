import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PublicHome from "./pages/PublicHome";
import AboutUs from "./pages/AboutUs";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import RecruiterAnalytics from "./pages/RecruiterAnalytics";
import CandidateDashboard from "./pages/CandidateDashboard";
import JobBrowser from "./pages/JobBrowser";
import AdvancedJobSearch from "./pages/AdvancedJobSearch";
import CreateJob from "./pages/CreateJob";
import AIMatchingDashboard from "./pages/AIMatchingDashboard";
import ApplicationManagement from "@/pages/ApplicationManagement";
import InterviewManagement from "@/pages/InterviewManagement";
import InterviewPlayback from "@/pages/InterviewPlayback";
import InterviewCalendar from "@/pages/InterviewCalendar";
import AIInterviewPage from "@/pages/AIInterviewPage";
import ResumeRankingDashboard from "@/pages/ResumeRankingDashboard";
import CustomerManagement from "@/pages/CustomerManagement";
import JobApplication from "./pages/JobApplication";
import CandidateSearch from "./pages/CandidateSearch";
import JobDetails from "./pages/JobDetails";
import MyApplications from "./pages/MyApplications";
import SavedJobs from "./pages/SavedJobs";
import ChallengeLibrary from "./pages/ChallengeLibrary";
import CodingInterviewPage from "./pages/CodingInterviewPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import SystemHealth from "./pages/SystemHealth";
import Analytics from "./pages/Analytics";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={PublicHome} />
      <Route path="/about" component={AboutUs} />

      <Route path={"/recruiter/dashboard"} component={RecruiterDashboard} />
      <Route path="/recruiter/analytics" component={RecruiterAnalytics} />
      <Route path="/recruiter/create-job" component={CreateJob} />
      <Route path="/recruiter/jobs/create" component={CreateJob} />
      <Route path="/recruiter/ai-matching" component={AIMatchingDashboard} />
      <Route path="/recruiter/applications" component={ApplicationManagement} />
      <Route path="/recruiter/interviews" component={InterviewManagement} />
      <Route path="/recruiter/interview-playback" component={InterviewPlayback} />
       <Route path="/recruiter/interview-calendar" component={InterviewCalendar} />
      <Route path="/recruiter/resume-ranking" component={ResumeRankingDashboard} />
      <Route path="/recruiter/customers" component={CustomerManagement} />
      <Route path="/recruiter/search-candidates" component={CandidateSearch} />
      <Route path="/recruiter/challenges" component={ChallengeLibrary} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users" component={UserManagement} />
      <Route path="/admin/health" component={SystemHealth} />
      <Route path="/admin/analytics" component={Analytics} />
      <Route path="/candidate-dashboard" component={CandidateDashboard} />
      <Route path="/my-applications" component={MyApplications} />
      <Route path="/saved-jobs" component={SavedJobs} />
      <Route path="/jobs" component={JobBrowser} />
      <Route path={"/jobs/search"} component={AdvancedJobSearch} />
      <Route path={"/jobs/:id"} component={JobDetails} />
      <Route path={"/apply/:id"} component={JobApplication} />
      <Route path="/ai-interview" component={AIInterviewPage} />
      <Route path="/coding-interview" component={CodingInterviewPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
