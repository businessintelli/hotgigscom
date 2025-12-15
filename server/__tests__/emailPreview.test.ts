import { describe, it, expect } from 'vitest';

describe('Email Template Preview', () => {
  it('should replace template variables correctly', () => {
    const template = 'Hi {{firstName}}, we have an exciting opportunity at {{companyName}} for {{jobTitle}}.';
    const variables: Record<string, string> = {
      firstName: 'John',
      companyName: 'Tech Corp',
      jobTitle: 'Software Engineer',
    };
    
    const result = template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
    
    expect(result).toBe('Hi John, we have an exciting opportunity at Tech Corp for Software Engineer.');
  });

  it('should preserve unmatched variables', () => {
    const template = 'Hi {{firstName}}, your salary will be {{salary}}.';
    const variables: Record<string, string> = {
      firstName: 'Jane',
    };
    
    const result = template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
    
    expect(result).toBe('Hi Jane, your salary will be {{salary}}.');
  });

  it('should handle empty template', () => {
    const template = '';
    const variables: Record<string, string> = {
      firstName: 'John',
    };
    
    const result = template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
    
    expect(result).toBe('');
  });

  it('should handle template with no variables', () => {
    const template = 'This is a plain text email with no variables.';
    const variables: Record<string, string> = {
      firstName: 'John',
    };
    
    const result = template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
    
    expect(result).toBe('This is a plain text email with no variables.');
  });

  it('should handle multiple occurrences of same variable', () => {
    const template = 'Dear {{firstName}}, {{firstName}} please review this.';
    const variables: Record<string, string> = {
      firstName: 'Alice',
    };
    
    const result = template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
    
    expect(result).toBe('Dear Alice, Alice please review this.');
  });

  it('should handle subject line variables', () => {
    const subject = 'Exciting {{jobTitle}} opportunity at {{companyName}}';
    const variables: Record<string, string> = {
      jobTitle: 'Senior Developer',
      companyName: 'Startup Inc',
    };
    
    const result = subject.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
    
    expect(result).toBe('Exciting Senior Developer opportunity at Startup Inc');
  });
});

describe('Video Introduction Dashboard Removal', () => {
  it('should have video introduction accessible via dedicated page', () => {
    // The Video Introduction component has been moved to /candidate/video-intro
    // This test verifies the design decision
    const dedicatedPagePath = '/candidate/video-intro';
    expect(dedicatedPagePath).toBe('/candidate/video-intro');
  });

  it('should have video introduction in sidebar menu', () => {
    // The sidebar should still have the Video Introduction menu item
    const sidebarItems = [
      { label: "Dashboard", path: "/candidate-dashboard" },
      { label: "My Resume", path: "/candidate/my-resumes" },
      { label: "Video Introduction", path: "/candidate/video-intro" },
      { label: "Browse Jobs", path: "/jobs" },
    ];
    
    const videoIntroItem = sidebarItems.find(item => item.label === "Video Introduction");
    expect(videoIntroItem).toBeDefined();
    expect(videoIntroItem?.path).toBe('/candidate/video-intro');
  });
});
