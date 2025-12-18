import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.js";

const challenges = [
  {
    title: "Two Sum",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].`,
    language: "python",
    difficulty: "easy",
    starterCode: `def twoSum(nums, target):
    # Your code here
    pass`,
    testCases: JSON.stringify([
      { input: [[2, 7, 11, 15], 9], output: [0, 1] },
      { input: [[3, 2, 4], 6], output: [1, 2] },
      { input: [[3, 3], 6], output: [0, 1] },
    ]),
    timeLimit: 300,
  },
  {
    title: "Reverse String",
    description: `Write a function that reverses a string. The input string is given as an array of characters.

You must do this by modifying the input array in-place with O(1) extra memory.

Example:
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]`,
    language: "javascript",
    difficulty: "easy",
    starterCode: `function reverseString(s) {
    // Your code here
}`,
    testCases: JSON.stringify([
      { input: [["h", "e", "l", "l", "o"]], output: ["o", "l", "l", "e", "h"] },
      { input: [["H", "a", "n", "n", "a", "h"]], output: ["h", "a", "n", "n", "a", "H"] },
    ]),
    timeLimit: 300,
  },
  {
    title: "Valid Parentheses",
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

Example:
Input: s = "()[]{}"
Output: true

Input: s = "(]"
Output: false`,
    language: "python",
    difficulty: "easy",
    starterCode: `def isValid(s):
    # Your code here
    pass`,
    testCases: JSON.stringify([
      { input: ["()"], output: true },
      { input: ["()[]{}"], output: true },
      { input: ["(]"], output: false },
      { input: ["([)]"], output: false },
    ]),
    timeLimit: 300,
  },
  {
    title: "Merge Two Sorted Lists",
    description: `You are given the heads of two sorted linked lists list1 and list2.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.

Example:
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]`,
    language: "python",
    difficulty: "medium",
    starterCode: `def mergeTwoLists(list1, list2):
    # Your code here
    # Return merged list as array
    pass`,
    testCases: JSON.stringify([
      { input: [[1, 2, 4], [1, 3, 4]], output: [1, 1, 2, 3, 4, 4] },
      { input: [[], []], output: [] },
      { input: [[], [0]], output: [0] },
    ]),
    timeLimit: 300,
  },
  {
    title: "Binary Search",
    description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

Example:
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4`,
    language: "javascript",
    difficulty: "easy",
    starterCode: `function search(nums, target) {
    // Your code here
}`,
    testCases: JSON.stringify([
      { input: [[-1, 0, 3, 5, 9, 12], 9], output: 4 },
      { input: [[-1, 0, 3, 5, 9, 12], 2], output: -1 },
      { input: [[5], 5], output: 0 },
    ]),
    timeLimit: 300,
  },
  {
    title: "Fibonacci Number",
    description: `The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.

Given n, calculate F(n).

Example:
Input: n = 4
Output: 3
Explanation: F(4) = F(3) + F(2) = 2 + 1 = 3`,
    language: "python",
    difficulty: "easy",
    starterCode: `def fib(n):
    # Your code here
    pass`,
    testCases: JSON.stringify([
      { input: [2], output: 1 },
      { input: [3], output: 2 },
      { input: [4], output: 3 },
      { input: [10], output: 55 },
    ]),
    timeLimit: 300,
  },
  {
    title: "Longest Substring Without Repeating Characters",
    description: `Given a string s, find the length of the longest substring without repeating characters.

Example:
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.

Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.`,
    language: "javascript",
    difficulty: "medium",
    starterCode: `function lengthOfLongestSubstring(s) {
    // Your code here
}`,
    testCases: JSON.stringify([
      { input: ["abcabcbb"], output: 3 },
      { input: ["bbbbb"], output: 1 },
      { input: ["pwwkew"], output: 3 },
      { input: [""], output: 0 },
    ]),
    timeLimit: 300,
  },
  {
    title: "Maximum Subarray",
    description: `Given an integer array nums, find the subarray with the largest sum, and return its sum.

Example:
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.`,
    language: "python",
    difficulty: "medium",
    starterCode: `def maxSubArray(nums):
    # Your code here
    pass`,
    testCases: JSON.stringify([
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], output: 6 },
      { input: [[1]], output: 1 },
      { input: [[5, 4, -1, 7, 8]], output: 23 },
    ]),
    timeLimit: 300,
  },
  {
    title: "Product of Array Except Self",
    description: `Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].

You must write an algorithm that runs in O(n) time and without using the division operation.

Example:
Input: nums = [1,2,3,4]
Output: [24,12,8,6]`,
    language: "javascript",
    difficulty: "medium",
    starterCode: `function productExceptSelf(nums) {
    // Your code here
}`,
    testCases: JSON.stringify([
      { input: [[1, 2, 3, 4]], output: [24, 12, 8, 6] },
      { input: [[-1, 1, 0, -3, 3]], output: [0, 0, 9, 0, 0] },
    ]),
    timeLimit: 300,
  },
  {
    title: "Climbing Stairs",
    description: `You are climbing a staircase. It takes n steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?

Example:
Input: n = 3
Output: 3
Explanation: There are three ways to climb to the top:
1. 1 step + 1 step + 1 step
2. 1 step + 2 steps
3. 2 steps + 1 step`,
    language: "python",
    difficulty: "easy",
    starterCode: `def climbStairs(n):
    # Your code here
    pass`,
    testCases: JSON.stringify([
      { input: [2], output: 2 },
      { input: [3], output: 3 },
      { input: [5], output: 8 },
    ]),
    timeLimit: 300,
  },
];

async function seedChallenges() {
  console.log("🌱 Seeding coding challenges...");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: "default" });

  try {
    // Insert challenges
    for (const challenge of challenges) {
      await db.insert(schema.codingChallenges).values(challenge);
      console.log(`✅ Added challenge: ${challenge.title}`);
    }

    console.log(`\n✨ Successfully seeded ${challenges.length} coding challenges!`);
  } catch (error) {
    console.error("❌ Error seeding challenges:", error);
  } finally {
    await connection.end();
  }
}

seedChallenges();
