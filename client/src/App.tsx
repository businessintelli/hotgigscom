import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import JobBrowser from "./pages/JobBrowser";
import CreateJob from "./pages/CreateJob";
import AIMatchingDashboard from "./pages/AIMatchingDashboard";
import ApplicationManagement from "@/pages/ApplicationManagement";
import InterviewManagement from "@/pages/InterviewManagement";
import InterviewPlayback from "@/pages/InterviewPlayback";
import AIInterviewPage from "@/pages/AIInterviewPage";
import CustomerManagement from "@/pages/CustomerManagement";
import JobApplication from "./pages/JobApplication";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />

      <Route path={"/recruiter/dashboard"} component={RecruiterDashboard} />
        <Route path="/recruiter/create-job" component={CreateJob} />
      <Route path="/recruiter/ai-matching" component={AIMatchingDashboard} />
      <Route path="/recruiter/applications" component={ApplicationManagement} />
      <Route path="/recruiter/interviews" component={InterviewManagement} />
      <Route path="/recruiter/interview-playback" component={InterviewPlayback} />
      <Route path={"/recruiter/customers"} component={CustomerManagement} />
      <Route path={"/candidate-dashboard"} component={CandidateDashboard} />
      <Route path={"/jobs"} component={JobBrowser} />
      <Route path={"/apply/:id"} component={JobApplication} />
      <Route path={"/ai-interview"} component={AIInterviewPage} />
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
