import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

interface TestCase {
  input: any;
  output: any;
}

interface TestResult {
  passed: boolean;
  input: any;
  expected: any;
  actual: any;
  error?: string;
}

interface ExecutionResult {
  status: "passed" | "failed" | "error";
  testResults: TestResult[];
  score: number;
  executionTime: number;
}

/**
 * Execute code safely in a temporary environment
 * Note: This is a simplified implementation. In production, use Docker containers or sandboxed environments.
 */
export async function executeCode(
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const testResults: TestResult[] = [];
  
  try {
    // Create temporary directory for code execution
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hotgigs-code-"));
    
    try {
      for (const testCase of testCases) {
        try {
          const result = await runSingleTest(code, language, testCase, tmpDir);
          testResults.push(result);
        } catch (error) {
          testResults.push({
            passed: false,
            input: testCase.input,
            expected: testCase.output,
            actual: null,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      
      // Calculate score
      const passedCount = testResults.filter(r => r.passed).length;
      const score = Math.round((passedCount / testCases.length) * 100);
      const status = passedCount === testCases.length ? "passed" : "failed";
      const executionTime = Date.now() - startTime;
      
      return {
        status,
        testResults,
        score,
        executionTime,
      };
    } finally {
      // Clean up temporary directory
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  } catch (error) {
    return {
      status: "error",
      testResults: [],
      score: 0,
      executionTime: Date.now() - startTime,
    };
  }
}

async function runSingleTest(
  code: string,
  language: string,
  testCase: TestCase,
  tmpDir: string
): Promise<TestResult> {
  let output: string;
  
  switch (language) {
    case "python":
      output = await runPython(code, testCase, tmpDir);
      break;
    case "javascript":
      output = await runJavaScript(code, testCase, tmpDir);
      break;
    case "java":
      output = await runJava(code, testCase, tmpDir);
      break;
    case "cpp":
      output = await runCpp(code, testCase, tmpDir);
      break;
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
  
  // Parse output and compare with expected
  let actual: any;
  try {
    actual = JSON.parse(output.trim());
  } catch {
    actual = output.trim();
  }
  
  const passed = JSON.stringify(actual) === JSON.stringify(testCase.output);
  
  return {
    passed,
    input: testCase.input,
    expected: testCase.output,
    actual,
  };
}

async function runPython(code: string, testCase: TestCase, tmpDir: string): Promise<string> {
  const fileName = path.join(tmpDir, "solution.py");
  
  // Wrap code with test input
  const wrappedCode = `
import json
import sys

${code}

# Test execution
input_data = ${JSON.stringify(testCase.input)}
result = solution(input_data) if 'solution' in dir() else None
print(json.dumps(result))
`;
  
  await fs.writeFile(fileName, wrappedCode);
  
  try {
    const { stdout, stderr } = await execAsync(`python3 ${fileName}`, {
      timeout: 5000, // 5 second timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
    });
    
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    
    return stdout;
  } catch (error: any) {
    throw new Error(error.message || "Execution error");
  }
}

async function runJavaScript(code: string, testCase: TestCase, tmpDir: string): Promise<string> {
  const fileName = path.join(tmpDir, "solution.js");
  
  const wrappedCode = `
${code}

// Test execution
const inputData = ${JSON.stringify(testCase.input)};
const result = typeof solution === 'function' ? solution(inputData) : null;
console.log(JSON.stringify(result));
`;
  
  await fs.writeFile(fileName, wrappedCode);
  
  try {
    const { stdout, stderr } = await execAsync(`node ${fileName}`, {
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });
    
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    
    return stdout;
  } catch (error: any) {
    throw new Error(error.message || "Execution error");
  }
}

async function runJava(code: string, testCase: TestCase, tmpDir: string): Promise<string> {
  const fileName = path.join(tmpDir, "Solution.java");
  
  // Simple Java wrapper (assumes class name is Solution)
  const wrappedCode = `
import com.google.gson.Gson;

${code}

public class Main {
  public static void main(String[] args) {
    Gson gson = new Gson();
    Object input = gson.fromJson("${JSON.stringify(testCase.input)}", Object.class);
    Solution solution = new Solution();
    Object result = solution.solve(input);
    System.out.println(gson.toJson(result));
  }
}
`;
  
  await fs.writeFile(fileName, wrappedCode);
  
  try {
    // Compile
    await execAsync(`javac ${fileName}`, { cwd: tmpDir, timeout: 10000 });
    
    // Run
    const { stdout, stderr } = await execAsync(`java -cp ${tmpDir} Main`, {
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });
    
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    
    return stdout;
  } catch (error: any) {
    throw new Error(error.message || "Execution error");
  }
}

async function runCpp(code: string, testCase: TestCase, tmpDir: string): Promise<string> {
  const fileName = path.join(tmpDir, "solution.cpp");
  
  const wrappedCode = `
#include <iostream>
#include <string>
using namespace std;

${code}

int main() {
  // Test execution
  string input = R"(${JSON.stringify(testCase.input)})";
  auto result = solution(input);
  cout << result << endl;
  return 0;
}
`;
  
  await fs.writeFile(fileName, wrappedCode);
  
  try {
    // Compile
    const binaryPath = path.join(tmpDir, "solution");
    await execAsync(`g++ -o ${binaryPath} ${fileName}`, { timeout: 10000 });
    
    // Run
    const { stdout, stderr } = await execAsync(binaryPath, {
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });
    
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    
    return stdout;
  } catch (error: any) {
    throw new Error(error.message || "Execution error");
  }
}
