import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import {
  HelpCircle,
  Search,
  MessageSquare,
  Mail,
  Book,
  Video,
  FileText,
  Send,
} from "lucide-react";

export default function Help() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Your message has been sent! We'll get back to you soon.");
    setContactForm({ subject: "", message: "" });
  };

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I create an account?",
          a: "Click the 'Sign Up' button in the top right corner and follow the registration process. You can sign up as either a candidate or recruiter.",
        },
        {
          q: "How do I complete my profile?",
          a: "Navigate to your dashboard and click on 'My Resume' or 'Profile Settings'. Fill in all the required fields including your experience, skills, and upload your resume.",
        },
        {
          q: "What's the difference between candidate and recruiter accounts?",
          a: "Candidate accounts are for job seekers looking for opportunities, while recruiter accounts are for employers and hiring managers posting jobs and searching for candidates.",
        },
      ],
    },
    {
      category: "For Candidates",
      questions: [
        {
          q: "How do I search for jobs?",
          a: "Use the 'Browse Jobs' section to search for opportunities. You can filter by job type, location, experience level, and more.",
        },
        {
          q: "How do I apply for a job?",
          a: "Click on any job listing and then click the 'Apply Now' button. Your profile information will be automatically filled in, but you can customize your application.",
        },
        {
          q: "Can I save jobs for later?",
          a: "Yes! Click the heart icon on any job listing to save it to your 'Saved Jobs' section for easy access later.",
        },
        {
          q: "How do I track my applications?",
          a: "Visit the 'My Applications' page to see all your submitted applications and their current status.",
        },
      ],
    },
    {
      category: "For Recruiters",
      questions: [
        {
          q: "How do I post a job?",
          a: "Go to your recruiter dashboard and click 'Create Job'. Fill in the job details, requirements, and publish it.",
        },
        {
          q: "How do I search for candidates?",
          a: "Use the 'Candidates' section to search our database. You can filter by skills, experience, location, and more.",
        },
        {
          q: "Can I use AI to match candidates?",
          a: "Yes! Our AI Matching feature analyzes job requirements and automatically suggests the best-fit candidates.",
        },
        {
          q: "How do I schedule interviews?",
          a: "Click on any application and use the 'Schedule Interview' button. You can send calendar invites directly to candidates.",
        },
      ],
    },
    {
      category: "Account & Billing",
      questions: [
        {
          q: "How do I change my password?",
          a: "Go to Settings > Privacy & Security and use the 'Change Password' section.",
        },
        {
          q: "How do I update my notification preferences?",
          a: "Visit Settings > Notifications to customize which alerts you want to receive.",
        },
        {
          q: "Is my data secure?",
          a: "Yes, we use industry-standard encryption and security measures to protect your data. Read our Privacy Policy for more details.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-2">
            <HelpCircle className="h-10 w-10" />
            Help & Support
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Find answers to your questions and get the help you need
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for help articles, FAQs, or topics..."
                className="pl-10 h-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq">
              <Book className="h-4 w-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="guides">
              <FileText className="h-4 w-4 mr-2" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Video className="h-4 w-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="contact">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Us
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <div className="space-y-6">
              {faqs.map((category, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle>{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((item, qIdx) => (
                        <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                          <AccordionTrigger className="text-left">
                            {item.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600 dark:text-gray-400">
                            {item.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Guides Tab */}
          <TabsContent value="guides">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Getting Started Guide
                  </CardTitle>
                  <CardDescription>
                    Learn the basics of using HotGigs platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Read Guide
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Profile Optimization
                  </CardTitle>
                  <CardDescription>
                    Tips to make your profile stand out
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Read Guide
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Interview Preparation
                  </CardTitle>
                  <CardDescription>
                    Ace your interviews with these tips
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Read Guide
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Recruiter Best Practices
                  </CardTitle>
                  <CardDescription>
                    Maximize your recruiting effectiveness
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Read Guide
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-red-600" />
                    Platform Overview
                  </CardTitle>
                  <CardDescription>5 minutes • Introduction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-red-600" />
                    How to Apply for Jobs
                  </CardTitle>
                  <CardDescription>3 minutes • For Candidates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-red-600" />
                    Posting Your First Job
                  </CardTitle>
                  <CardDescription>4 minutes • For Recruiters</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-red-600" />
                    Using AI Features
                  </CardTitle>
                  <CardDescription>6 minutes • Advanced</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form and we'll get back to you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="What do you need help with?"
                        value={contactForm.subject}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, subject: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Describe your issue or question in detail..."
                        rows={6}
                        value={contactForm.message}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, message: e.target.value })
                        }
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600" />
                      Email Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      For general inquiries and support
                    </p>
                    <a
                      href="mailto:support@hotgigs.com"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      support@hotgigs.com
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                      Live Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Chat with our support team in real-time
                    </p>
                    <Button variant="outline" className="w-full">
                      Start Live Chat
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Support Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Monday - Friday</span>
                        <span className="font-medium">9:00 AM - 6:00 PM EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Saturday</span>
                        <span className="font-medium">10:00 AM - 4:00 PM EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Sunday</span>
                        <span className="font-medium">Closed</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
