import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { spawn } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

const TEST_PRD_PATH = join(import.meta.dir, "test-cli-integration.json");

const INITIAL_PRD = {
  project: "Test Project",
  backlog: [
    {
      id: "1",
      priority: 1,
      feature: "Test task",
      status: "pending" as const,
      category: "feature" as const,
      createdAt: "2026-01-05T10:00:00Z",
      completedAt: null,
      completedBy: null,
      dependencies: [],
      notes: null
    },
    {
      id: "2",
      priority: 2,
      feature: "Another task",
      status: "completed" as const,
      category: "bugfix" as const,
      createdAt: "2026-01-05T10:00:00Z",
      completedAt: "2026-01-05T11:00:00Z",
      completedBy: "manual",
      dependencies: [],
      notes: null
    }
  ]
};

describe("CLI Integration Tests", () => {
  beforeEach(() => {
    if (existsSync(TEST_PRD_PATH)) {
      unlinkSync(TEST_PRD_PATH);
    }
    writeFileSync(TEST_PRD_PATH, JSON.stringify(INITIAL_PRD, null, 2));
  });

  afterEach(() => {
    if (existsSync(TEST_PRD_PATH)) {
      unlinkSync(TEST_PRD_PATH);
    }
  });

  function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const env = { ...process.env, PRD_PATH: TEST_PRD_PATH };
      const proc = spawn("bun", ["run", "src/task-cli.ts", ...args], { env });
      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        resolve({ stdout, stderr, exitCode: code ?? 0 });
      });
    });
  }

  test("list should show all tasks", async () => {
    const result = await runCli(["list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Test task");
    expect(result.stdout).toContain("Another task");
  });

  test("list with status filter should work", async () => {
    const result = await runCli(["list", "--status", "pending"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Test task");
    expect(result.stdout).not.toContain("Another task");
  });

  test("list with category filter should work", async () => {
    const result = await runCli(["list", "--category", "feature"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Test task");
    expect(result.stdout).not.toContain("Another task");
  });

  test("update without ID should show error", async () => {
    const result = await runCli(["update"]);
    expect(result.stderr).toContain("Usage: bun run task update <id>");
    expect(result.exitCode).toBe(1);
  });

  test("complete without ID should show error", async () => {
    const result = await runCli(["complete"]);
    expect(result.stderr).toContain("Usage: bun run task complete <id>");
    expect(result.exitCode).toBe(1);
  });

  test("complete with non-existent ID should fail", async () => {
    const result = await runCli(["complete", "999"]);
    expect(result.stderr).toContain("Failed to complete task");
    expect(result.exitCode).toBe(1);
  });

  test("status should show task summary", async () => {
    const result = await runCli(["status"]);
    expect(result.stdout).toContain("Task Summary");
    expect(result.stdout).toContain("Total: 2");
    expect(result.stdout).toContain("Pending: 1");
    expect(result.stdout).toContain("Completed: 1");
    expect(result.exitCode).toBe(0);
  });

  test("help should show usage information", async () => {
    const result = await runCli(["invalid-command"]);
    expect(result.stdout).toContain("Usage: bun run task <command>");
    expect(result.stdout).toContain("Commands:");
    expect(result.stdout).toContain("add");
    expect(result.stdout).toContain("list");
    expect(result.stdout).toContain("update");
    expect(result.stdout).toContain("complete");
    expect(result.stdout).toContain("status");
    expect(result.exitCode).toBe(0);
  });

  test("list with no tasks should show message", async () => {
    const emptyPrd = { project: "Empty", backlog: [] };
    writeFileSync(TEST_PRD_PATH, JSON.stringify(emptyPrd, null, 2));
    const result = await runCli(["list"]);
    expect(result.stdout).toContain("No tasks found");
    expect(result.exitCode).toBe(0);
  });

  test("list default should show recently completed and ready tasks", async () => {
    const prdWithReady = {
      project: "Test Project",
      backlog: [
        {
          id: "1",
          priority: 2,
          feature: "Completed task",
          status: "completed" as const,
          category: "feature" as const,
          createdAt: "2026-01-05T10:00:00Z",
          completedAt: "2026-01-05T11:00:00Z",
          completedBy: "manual",
          dependencies: [],
          notes: null
        },
        {
          id: "2",
          priority: 1,
          feature: "Ready task",
          status: "pending" as const,
          category: "feature" as const,
          createdAt: "2026-01-05T10:00:00Z",
          completedAt: null,
          completedBy: null,
          dependencies: [],
          notes: null
        },
        {
          id: "3",
          priority: 3,
          feature: "Blocked task",
          status: "pending" as const,
          category: "feature" as const,
          createdAt: "2026-01-05T10:00:00Z",
          completedAt: null,
          completedBy: null,
          dependencies: ["999"],
          notes: null
        }
      ]
    };
    writeFileSync(TEST_PRD_PATH, JSON.stringify(prdWithReady, null, 2));

    const result = await runCli(["list"]);
    expect(result.stdout).toContain("Recently completed");
    expect(result.stdout).toContain("Completed task");
    expect(result.stdout).toContain("Available tasks");
    expect(result.stdout).toContain("Ready task");
    expect(result.stdout).not.toContain("Blocked task");
    expect(result.exitCode).toBe(0);
  });

  test("list --all should show all tasks", async () => {
    const result = await runCli(["list", "--all"]);
    expect(result.stdout).toContain("Test task");
    expect(result.stdout).toContain("Another task");
    expect(result.stdout).not.toContain("Recently completed");
    expect(result.stdout).not.toContain("Available tasks");
    expect(result.exitCode).toBe(0);
  });

  test("list --all with status filter should work", async () => {
    const result = await runCli(["list", "--all", "--status", "pending"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Test task");
    expect(result.stdout).not.toContain("Another task");
    expect(result.stdout).not.toContain("Recently completed");
    expect(result.stdout).not.toContain("Available tasks");
  });

  test("list default should prioritize ready tasks by priority", async () => {
    const prdWithPriorities = {
      project: "Test Project",
      backlog: [
        {
          id: "1",
          priority: 3,
          feature: "Low priority ready",
          status: "pending" as const,
          category: "feature" as const,
          createdAt: "2026-01-05T10:00:00Z",
          completedAt: null,
          completedBy: null,
          dependencies: [],
          notes: null
        },
        {
          id: "2",
          priority: 1,
          feature: "High priority ready",
          status: "pending" as const,
          category: "feature" as const,
          createdAt: "2026-01-05T10:00:00Z",
          completedAt: null,
          completedBy: null,
          dependencies: [],
          notes: null
        },
        {
          id: "3",
          priority: 2,
          feature: "Medium priority ready",
          status: "pending" as const,
          category: "feature" as const,
          createdAt: "2026-01-05T10:00:00Z",
          completedAt: null,
          completedBy: null,
          dependencies: [],
          notes: null
        }
      ]
    };
    writeFileSync(TEST_PRD_PATH, JSON.stringify(prdWithPriorities, null, 2));

    const result = await runCli(["list"]);
    const lines = result.stdout.split("\n");
    const readyLines = lines.filter(line => line.includes("ready"));
    
    expect(readyLines[0]).toContain("High priority ready");
    expect(readyLines[1]).toContain("Medium priority ready");
    expect(readyLines[2]).toContain("Low priority ready");
    expect(result.exitCode).toBe(0);
  });
});
