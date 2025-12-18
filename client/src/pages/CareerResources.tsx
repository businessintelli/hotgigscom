import { useState } from "react";
import CandidateLayout from "@/components/CandidateLayout";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Video,
  Lightbulb,
  Target,
  TrendingUp,
  Award,
  Users,
  Search,
  ExternalLink,
  Clock,
  Star,
  Play,
  Download,
  ChevronRight,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Zap,
} from "lucide-react";

const resources = {
  articles: [
    {
      id: 1,
      title: "How to Write a Winning Resume in 2024",
      description: "Learn the latest resume writing techniques that get you noticed by recruiters and pass ATS systems.",
      category: "Resume Tips",
      readTime: "8 min read",
      featured: true,
      icon: FileText,
    },
    {
      id: 2,
      title: "Mastering the STAR Interview Method",
      description: "Ace behavioral interviews by structuring your answers using the proven STAR technique.",
      category: "Interview Prep",
      readTime: "6 min read",
      featured: true,
      icon: Target,
    },
    {
      id: 3,
      title: "Negotiating Your Salary: A Complete Guide",
      description: "Strategies and scripts to help you negotiate the compensation you deserve.",
      category: "Career Growth",
      readTime: "10 min read",
      featured: false,
      icon: TrendingUp,
    },
    {
      id: 4,
      title: "Building Your Personal Brand on LinkedIn",
      description: "Tips for optimizing your LinkedIn profile and growing your professional network.",
      category: "Networking",
      readTime: "7 min read",
      featured: false,
      icon: Users,
    },
    {
      id: 5,
      title: "Top Skills Employers Want in 2024",
      description: "Stay competitive by developing the most in-demand skills across industries.",
      category: "Skills",
      readTime: "5 min read",
      featured: true,
      icon: Award,
    },
    {
      id: 6,
      title: "Remote Work Best Practices",
      description: "How to thrive in a remote work environment and stand out to employers.",
      category: "Career Growth",
      readTime: "6 min read",
      featured: false,
      icon: Briefcase,
    },
  ],
  videos: [
    {
      id: 1,
      title: "Interview Confidence Masterclass",
      description: "Build unshakeable confidence for any interview situation.",
      duration: "45 min",
      thumbnail: "interview",
      instructor: "Sarah Chen, Career Coach",
    },
    {
      id: 2,
      title: "Resume Writing Workshop",
      description: "Step-by-step guide to creating a professional resume.",
      duration: "30 min",
      thumbnail: "resume",
      instructor: "Michael Torres, HR Director",
    },
    {
      id: 3,
      title: "Networking Like a Pro",
      description: "Effective strategies for building meaningful professional connections.",
      duration: "25 min",
      thumbnail: "networking",
      instructor: "Emily Watson, Recruiter",
    },
    {
      id: 4,
      title: "Technical Interview Prep",
      description: "Prepare for coding interviews and technical assessments.",
      duration: "60 min",
      thumbnail: "technical",
      instructor: "David Kim, Senior Engineer",
    },
  ],
  templates: [
    {
      id: 1,
      title: "Professional Resume Template",
      description: "Clean, ATS-friendly resume template for any industry.",
      downloads: 12500,
      format: "DOCX, PDF",
    },
    {
      id: 2,
      title: "Cover Letter Template",
      description: "Customizable cover letter that highlights your strengths.",
      downloads: 8300,
      format: "DOCX, PDF",
    },
    {
      id: 3,
      title: "Thank You Email Template",
      description: "Post-interview thank you email that leaves a lasting impression.",
      downloads: 5600,
      format: "TXT",
    },
    {
      id: 4,
      title: "Salary Negotiation Script",
      description: "Word-for-word scripts for negotiating your compensation.",
      downloads: 4200,
      format: "PDF",
    },
  ],
  tools: [
    {
      id: 1,
      title: "AI Resume Analyzer",
      description: "Get instant feedback on your resume with AI-powered analysis.",
      icon: Zap,
      action: "Analyze Resume",
    },
    {
      id: 2,
      title: "Interview Question Generator",
      description: "Practice with AI-generated interview questions for your target role.",
      icon: MessageSquare,
      action: "Generate Questions",
    },
    {
      id: 3,
      title: "Salary Calculator",
      description: "Research competitive salaries for your role and location.",
      icon: TrendingUp,
      action: "Calculate Salary",
    },
    {
      id: 4,
      title: "Skills Gap Analyzer",
      description: "Identify skills you need to develop for your dream job.",
      icon: Target,
      action: "Analyze Skills",
    },
  ],
};

export default function CareerResources() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("articles");

  const filteredArticles = resources.articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <CandidateLayout title="Career Resources">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/candidate-dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Career Resources</h1>
              <p className="text-slate-500">Tools and guides to accelerate your career</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Hero Section */}
        <Card className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 overflow-hidden">
          <CardContent className="p-8 relative">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <Badge className="bg-white/20 text-white mb-4">Free Resources</Badge>
              <h2 className="text-3xl font-bold mb-2">Level Up Your Career</h2>
              <p className="text-purple-100 mb-6 max-w-xl">
                Access expert guides, video tutorials, templates, and AI-powered tools to help you land your dream job.
              </p>
              <div className="flex gap-4">
                <Button className="bg-white text-purple-600 hover:bg-purple-50">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Start Learning
                </Button>
                <Button variant="outline" className="border-white/50 text-white hover:bg-white/10">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              AI Tools
            </TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg ${article.featured ? "bg-purple-100" : "bg-slate-100"}`}>
                        <article.icon className={`h-5 w-5 ${article.featured ? "text-purple-600" : "text-slate-600"}`} />
                      </div>
                      {article.featured && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                      {article.title}
                    </CardTitle>
                    <CardDescription>{article.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{article.category}</Badge>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readTime}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.videos.map((video) => (
                <Card key={video.id} className="hover:shadow-lg transition-shadow overflow-hidden group">
                  <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors cursor-pointer">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <Badge className="absolute top-3 right-3 bg-black/50 text-white">
                      {video.duration}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{video.title}</CardTitle>
                    <CardDescription>{video.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">Instructor: {video.instructor}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.templates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <Badge variant="outline">{template.format}</Badge>
                    </div>
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        <Download className="h-3 w-3 inline mr-1" />
                        {template.downloads.toLocaleString()} downloads
                      </span>
                      <Button size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="tools">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.tools.map((tool) => (
                <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                        <tool.icon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{tool.title}</CardTitle>
                        <CardDescription>{tool.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      {tool.action}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Popular resources to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <FileText className="h-5 w-5" />
                <span>Resume Guide</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <MessageSquare className="h-5 w-5" />
                <span>Interview Tips</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>Salary Guide</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Users className="h-5 w-5" />
                <span>Networking</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </CandidateLayout>
  );
}
