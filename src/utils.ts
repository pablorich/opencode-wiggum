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
  process.stdout.write(question);
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const data: string[] = [];
    stdin.on("data", (chunk) => data.push(chunk.toString()));
    stdin.once("end", () => resolve(data.join("").trim()));
  });
}
