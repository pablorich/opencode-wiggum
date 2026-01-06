import readline from "node:readline";
import type { TaskCategory } from "./types.js";

export function inferCategory(description: string): TaskCategory {
  const lower = description.toLowerCase();
  if (lower.includes("setup") || lower.includes("set up") || lower.includes("initialize") || lower.includes("configure") || lower.includes("install") || lower.includes("create config")) {
    return "infrastructure";
  }
  if (lower.includes("test") || lower.includes("fix") || lower.includes("bug")) {
    return "bugfix";
  }
  if (lower.includes("refactor") || lower.includes("clean") || lower.includes("optimize")) {
    return "refactor";
  }
  if (lower.includes("documentation") || lower.includes("readme") || lower.includes("agents.md")) {
    return "docs";
  }
  return "feature";
}

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
