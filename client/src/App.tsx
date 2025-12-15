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
import JobManagement from "@/pages/JobManagement";
import SubmissionManagement from "@/pages/SubmissionManagement";
import InterviewManagement from "@/pages/InterviewManagement";
import InterviewPlayback from "@/pages/InterviewPlayback";
import InterviewCalendar from "@/pages/InterviewCalendar";
import AIInterviewPage from "@/pages/AIInterviewPage";
import ResumeRankingDashboard from "@/pages/ResumeRankingDashboard";
import BulkResumeUpload from "@/pages/BulkResumeUpload";
import CustomerManagement from "@/pages/CustomerManagement";
import JobApplication from "./pages/JobApplication";
import CandidateSearch from "./pages/CandidateSearch";
import AdvancedCandidateSearch from "./pages/AdvancedCandidateSearch";
import EmailTemplateManager from "./pages/EmailTemplateManager";
import CampaignBuilder from "./pages/CampaignBuilder";
import FollowUpSequenceBuilder from './pages/FollowUpSequenceBuilder';
import Unsubscribe from './pages/Unsubscribe';
import ResumeUploadReview from './pages/ResumeUploadReview';
import EmailProviderSettings from "./pages/EmailProviderSettings";
import VideoProviderSettings from "./pages/VideoProviderSettings";
import EmailDeliveryDashboard from "./pages/EmailDeliveryDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import JobDetails from "./pages/JobDetails";
import MyApplications from "./pages/MyApplications";
import SavedJobs from "./pages/SavedJobs";
import MyResumes from "./pages/MyResumesNew";
import ResumeDetail from "./pages/ResumeDetail";
import ChallengeLibrary from "./pages/ChallengeLibrary";
import CodingInterviewPage from "./pages/CodingInterviewPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import SystemHealth from "./pages/SystemHealth";
import Analytics from "./pages/Analytics";
import { ActiveAssociates } from "./pages/ActiveAssociates";
import { OnboardingTasks } from "./pages/OnboardingTasks";
import SelectRole from "./pages/SelectRole";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import ResendVerification from "./pages/ResendVerification";
import VerificationRequired from "./pages/auth/VerificationRequired";
import RecruiterOnboarding from "./pages/RecruiterOnboarding";
import CandidateOnboarding from "./pages/CandidateOnboarding";
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={PublicHome} />
      <Route path="/about" component={AboutUs} />

      <Route path={"/recruiter/dashboard"} component={RecruiterDashboard} />
      <Route path="/recruiter/analytics" component={RecruiterAnalytics} />
      <Route path="/recruiter/create-job" component={CreateJob} />
      <Route path="/recruiter/jobs/create" component={CreateJob} />
      <Route path="/recruiter/jobs" component={JobManagement} />
      <Route path="/recruiter/submissions" component={SubmissionManagement} />
      <Route path="/recruiter/ai-matching" component={AIMatchingDashboard} />
      <Route path="/recruiter/applications" component={ApplicationManagement} />
      <Route path="/recruiter/interviews" component={InterviewManagement} />
      <Route path="/recruiter/interview-playback" component={InterviewPlayback} />
      <Route path="/recruiter/bulk-upload" component={BulkResumeUpload} />
       <Route path="/recruiter/interview-calendar" component={InterviewCalendar} />
      <Route path="/recruiter/resume-ranking" component={ResumeRankingDashboard} />
      <Route path="/recruiter/customers" component={CustomerManagement} />
      <Route path="/recruiter/search-candidates" component={CandidateSearch} />
      <Route path="/recruiter/advanced-search" component={AdvancedCandidateSearch} />
      <Route path="/recruiter/email-templates" component={EmailTemplateManager} />
      <Route path="/recruiter/campaigns" component={CampaignBuilder} />
      <Route path="/recruiter/sequences" component={FollowUpSequenceBuilder} />
      <Route path="/unsubscribe/:trackingId" component={Unsubscribe} />
      <Route path="/recruiter/challenges" component={ChallengeLibrary} />
      <Route path="/recruiter/active-associates" component={ActiveAssociates} />
      <Route path="/recruiter/onboarding-tasks" component={OnboardingTasks} />
      <Route path="/select-role" component={SelectRole} />
      <Route path="/signup" component={SignUp} />
      <Route path="/signin" component={SignIn} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/resend-verification" component={ResendVerification} />
      <Route path="/verification-required" component={VerificationRequired} />
      <Route path="/recruiter/onboarding" component={RecruiterOnboarding} />
      <Route path="/candidate/onboarding" component={CandidateOnboarding} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users" component={UserManagement} />
      <Route path="/admin/health" component={SystemHealth} />
      <Route path="/admin/email-settings" component={EmailProviderSettings} />
      <Route path="/admin/video-settings" component={VideoProviderSettings} />
      <Route path="/admin/email-delivery" component={EmailDeliveryDashboard} />
      <Route path="/admin/analytics" component={Analytics} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route path="/candidate-dashboard" component={CandidateDashboard} />
      <Route path="/my-applications" component={MyApplications} />
      <Route path="/saved-jobs" component={SavedJobs} />
      <Route path="/my-resumes" component={MyResumes} />
      <Route path="/candidate/my-resumes" component={MyResumes} />
      <Route path="/candidate/resume/:id" component={ResumeDetail} />
      <Route path="/jobs" component={JobBrowser} />
      <Route path={"/jobs/search"} component={AdvancedJobSearch} />
      <Route path={"/jobs/:id"} component={JobDetails} />
      <Route path={"/apply/:id"} component={JobApplication} />
      <Route path="/ai-interview" component={AIInterviewPage} />
      <Route path="/coding-interview" component={CodingInterviewPage} />
      <Route path="/resume-upload" component={ResumeUploadReview} />
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
          <SessionExpiryWarning />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
