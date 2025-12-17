// Code Execution Service using Judge0 API
// This service provides secure code execution for coding challenges

export interface CodeExecutionInput {
  sourceCode: string;
  languageId: number; // Judge0 language ID
  stdin?: string;
  expectedOutput?: string;
  timeLimit?: number; // in seconds
  memoryLimit?: number; // in KB
}

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTime: number;
  memory: number;
}

export interface CodeExecutionResult {
  status: 'success' | 'error' | 'timeout' | 'compilation_error';
  output?: string;
  error?: string;
  executionTime: number;
  memory: number;
  testCaseResults?: TestCaseResult[];
  passedTestCases: number;
  totalTestCases: number;
}

// Language ID mapping for Judge0
export const LANGUAGE_IDS = {
  javascript: 63, // Node.js
  python: 71, // Python 3
  java: 62, // Java
  cpp: 54, // C++ 17
  c: 50, // C
  csharp: 51, // C#
  ruby: 72, // Ruby
  go: 60, // Go
  rust: 73, // Rust
  php: 68, // PHP
  typescript: 74, // TypeScript
};

/**
 * Execute code using Judge0 API
 * For now, this is a mock implementation. In production, you would:
 * 1. Sign up for Judge0 RapidAPI key
 * 2. Make POST request to https://judge0-ce.p.rapidapi.com/submissions
 * 3. Poll for results using the submission token
 */
export async function executeCode(input: CodeExecutionInput): Promise<CodeExecutionResult> {
  // Mock implementation - replace with actual Judge0 API calls
  // In production, you would use the Judge0 API like this:
  /*
  const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    },
    body: JSON.stringify({
      source_code: input.sourceCode,
      language_id: input.languageId,
      stdin: input.stdin || '',
      cpu_time_limit: input.timeLimit || 5,
      memory_limit: input.memoryLimit || 256000,
    })
  });
  
  const result = await response.json();
  */

  // Mock result for demonstration
  const mockResult: CodeExecutionResult = {
    status: 'success',
    output: 'Mock output - Code executed successfully',
    executionTime: 0.05,
    memory: 2048,
    passedTestCases: 0,
    totalTestCases: 0,
  };

  return mockResult;
}

/**
 * Execute code against multiple test cases
 */
export async function executeCodeWithTestCases(
  sourceCode: string,
  languageId: number,
  testCases: Array<{ input: string; expectedOutput: string }>,
  timeLimit?: number,
  memoryLimit?: number
): Promise<CodeExecutionResult> {
  const results: TestCaseResult[] = [];
  let passedCount = 0;

  for (const testCase of testCases) {
    const result = await executeCode({
      sourceCode,
      languageId,
      stdin: testCase.input,
      expectedOutput: testCase.expectedOutput,
      timeLimit,
      memoryLimit,
    });

    const actualOutput = result.output?.trim() || '';
    const expectedOutput = testCase.expectedOutput.trim();
    const passed = actualOutput === expectedOutput;

    if (passed) passedCount++;

    results.push({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput,
      passed,
      executionTime: result.executionTime,
      memory: result.memory,
    });
  }

  return {
    status: 'success',
    testCaseResults: results,
    passedTestCases: passedCount,
    totalTestCases: testCases.length,
    executionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
    memory: Math.max(...results.map(r => r.memory)),
  };
}

/**
 * Get language ID from language name
 */
export function getLanguageId(language: string): number {
  const lang = language.toLowerCase();
  return LANGUAGE_IDS[lang as keyof typeof LANGUAGE_IDS] || LANGUAGE_IDS.javascript;
}
