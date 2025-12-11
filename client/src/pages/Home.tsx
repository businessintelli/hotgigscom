import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, Target } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (user) {
      if (user.role === "candidate") {
        setLocation("/candidate-dashboard");
      } else if (user.role === "recruiter") {
        setLocation("/recruiter/dashboard");
      }
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              HG
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HotGigs
              </h1>
              <p className="text-sm text-gray-600">AI-Powered Recruitment Platform</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          HotGigs - AI-Powered Recruitment Platform
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          AI-Powered Recruitment Platform for Modern Hiring
        </p>
        <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
          Connect top talent with great opportunities. Streamline your recruitment process with intelligent matching and automated workflows.
        </p>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Recruiter Card */}
          <Card className="p-8 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">For Recruiters</h3>
            <p className="text-gray-600 mb-6">
              Post jobs, manage candidates, and find the perfect match
            </p>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>AI-powered candidate matching</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Automated job posting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Client management tools</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Application tracking</span>
              </li>
            </ul>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              onClick={() => window.location.href = getLoginUrl("recruiter")}
            >
              Get Started as Recruiter
            </Button>
          </Card>

          {/* Candidate Card */}
          <Card className="p-8 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">For Candidates</h3>
            <p className="text-gray-600 mb-6">
              Find your dream job and showcase your skills
            </p>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Browse curated job listings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Upload and manage resumes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Track application status</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Get matched with opportunities</span>
              </li>
            </ul>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              onClick={() => window.location.href = getLoginUrl("candidate")}
            >
              Get Started as Candidate
            </Button>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Why Choose HotGigs?</h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-6 text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h4 className="text-xl font-bold mb-2">AI-Powered Matching</h4>
            <p className="text-gray-600">
              Advanced algorithms match candidates with the perfect opportunities
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h4 className="text-xl font-bold mb-2">Fast & Efficient</h4>
            <p className="text-gray-600">
              Streamlined workflows save time for both recruiters and candidates
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h4 className="text-xl font-bold mb-2">Secure & Private</h4>
            <p className="text-gray-600">
              Your data is protected with enterprise-grade security
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>© 2024 HotGigs. All rights reserved.</p>
      </footer>
    </div>
  );
}
