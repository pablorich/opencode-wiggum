import { describe, test, expect } from "bun:test";
import { join } from "path";
import { TaskRepository } from "../src/task-repository";
import { unlinkSync, existsSync, writeFileSync } from "fs";

describe("Cross-platform Compatibility", () => {
  const TEST_PRD_PATH = join(import.meta.dir, "test-cross-platform.json");

  const TEST_PRD = {
    project: "Cross-platform Test",
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
      }
    ]
  };

  test("join creates correct path for current platform", () => {
    const path = join("dir", "file.json");
    
    if (process.platform === "win32") {
      expect(path).toContain("\\");
      expect(path).not.toContain("/");
    } else {
      expect(path).toContain("/");
      expect(path).not.toContain("\\");
    }
  });

  test("import.meta.dir works correctly across platforms", () => {
    expect(typeof import.meta.dir).toBe("string");
    expect(import.meta.dir.length).toBeGreaterThan(0);
  });

  test("TaskRepository reads and writes with platform-correct paths", async () => {
    const repository = new TaskRepository(TEST_PRD_PATH);
    
    await repository.writePrd(TEST_PRD);
    expect(existsSync(TEST_PRD_PATH)).toBe(true);
    
    const prd = await repository.readPrd();
    expect(prd.project).toBe("Cross-platform Test");
    
    unlinkSync(TEST_PRD_PATH);
    expect(existsSync(TEST_PRD_PATH)).toBe(false);
  });

  test("JSON serialization handles all platforms correctly", async () => {
    const repository = new TaskRepository(TEST_PRD_PATH);
    
    const prdWithForwardSlash = JSON.stringify(TEST_PRD, null, 2);
    
    writeFileSync(TEST_PRD_PATH, prdWithForwardSlash);
    const prd = await repository.readPrd();
    expect(prd.project).toBe("Cross-platform Test");
    
    unlinkSync(TEST_PRD_PATH);
  });

  test("file operations work with relative paths", async () => {
    const repository = new TaskRepository(TEST_PRD_PATH);
    
    await repository.writePrd(TEST_PRD);
    
    const file = Bun.file(TEST_PRD_PATH);
    const text = await file.text();
    const parsed = JSON.parse(text);
    
    expect(parsed.project).toBe("Cross-platform Test");
    
    unlinkSync(TEST_PRD_PATH);
  });

  test("path separators are consistent across operations", async () => {
    const repository = new TaskRepository(TEST_PRD_PATH);
    
    const parts = TEST_PRD_PATH.split(process.platform === "win32" ? "\\" : "/");
    expect(parts.length).toBeGreaterThan(1);
    
    await repository.writePrd(TEST_PRD);
    
    const prd = await repository.readPrd();
    expect(prd.backlog).toHaveLength(1);
    
    unlinkSync(TEST_PRD_PATH);
  });
});
