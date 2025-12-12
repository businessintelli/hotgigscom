import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, Zap, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { APP_TITLE, getLoginUrl } from "@/const";

export default function AboutUs() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Top Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 
                className="text-2xl font-bold text-blue-600 cursor-pointer"
                onClick={() => setLocation("/")}
              >
                {APP_TITLE}
              </h1>
              <div className="hidden md:flex gap-6">
                <button 
                  onClick={() => setLocation("/")}
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Home
                </button>
                <button className="text-blue-600 font-medium">
                  About Us
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => window.location.href = getLoginUrl()}>
                Sign In
              </Button>
              <Button onClick={() => window.location.href = "/signup"}>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            About {APP_TITLE}
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            We're revolutionizing recruitment with AI-powered technology that connects top talent with great opportunities. Our platform streamlines the hiring process for both candidates and employers.
          </p>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Mission & Values
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-bold text-lg mb-2">Innovation</h4>
                <p className="text-gray-600">
                  Leveraging cutting-edge AI to transform recruitment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-bold text-lg mb-2">People First</h4>
                <p className="text-gray-600">
                  Putting candidates and employers at the heart of everything
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-bold text-lg mb-2">Efficiency</h4>
                <p className="text-gray-600">
                  Streamlining processes to save time and resources
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                <h4 className="font-bold text-lg mb-2">Trust</h4>
                <p className="text-gray-600">
                  Building secure, transparent relationships
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Our Story
          </h3>
          <div className="prose prose-lg mx-auto text-gray-600">
            <p className="mb-4">
              Founded in 2024, {APP_TITLE} was born from a simple observation: traditional recruitment processes were broken. They were slow, biased, and inefficient for both candidates and employers.
            </p>
            <p className="mb-4">
              We set out to change that by building an AI-powered platform that makes hiring faster, fairer, and more effective. Our technology includes smart resume screening, AI-powered interviews, fraud detection, and intelligent matching algorithms.
            </p>
            <p>
              Today, we're proud to serve thousands of candidates and hundreds of companies, helping them find the perfect match. Our platform has facilitated countless successful hires and continues to evolve with the latest AI innovations.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="container mx-auto text-center max-w-3xl">
          <h3 className="text-4xl font-bold mb-6">
            Ready to Transform Your Hiring?
          </h3>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of companies and candidates who trust {APP_TITLE} for their recruitment needs.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setLocation("/auth/signup")}
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
              onClick={() => setLocation("/")}
            >
              Browse Jobs
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">{APP_TITLE}</h4>
              <p className="text-gray-400">
                AI-Powered Recruitment Platform for Modern Hiring
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">For Job Seekers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/" className="hover:text-white">Browse Jobs</a></li>
                <li><a href="#" className="hover:text-white">Career Advice</a></li>
                <li><a href="#" className="hover:text-white">Resume Tips</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">For Employers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Post a Job</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Resources</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {APP_TITLE}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
