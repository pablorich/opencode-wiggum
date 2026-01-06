import { describe, test, expect, beforeEach } from "bun:test";
import { TaskRepository } from "../src/task-repository";
import { unlinkSync, existsSync, writeFileSync } from "fs";
import { join } from "path";

const TEST_PRD_PATH = join(import.meta.dir, "test-prd.json");

const TEST_PRD = {
  project: "Test Project",
  backlog: [
    {
      id: "1",
      priority: 1,
      feature: "Test task 1",
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

describe("TaskRepository", () => {
  let repository: TaskRepository;

  beforeEach(() => {
    repository = new TaskRepository(TEST_PRD_PATH);
    if (existsSync(TEST_PRD_PATH)) {
      unlinkSync(TEST_PRD_PATH);
    }
  });

  test("readPrd should read and parse PRD file", async () => {
    writeFileSync(TEST_PRD_PATH, JSON.stringify(TEST_PRD, null, 2));
    const prd = await repository.readPrd();

    expect(prd.project).toBe("Test Project");
    expect(prd.backlog).toHaveLength(1);
    expect(prd.backlog[0].id).toBe("1");
  });

  test("writePrd should write PRD to file", async () => {
    await repository.writePrd(TEST_PRD);
    const prd = await repository.readPrd();

    expect(prd.project).toBe("Test Project");
    expect(prd.backlog).toHaveLength(1);
  });

  test("writePrd should overwrite existing file", async () => {
    await repository.writePrd(TEST_PRD);

    const updatedPrd = {
      ...TEST_PRD,
      project: "Updated Project"
    };

    await repository.writePrd(updatedPrd);
    const prd = await repository.readPrd();

    expect(prd.project).toBe("Updated Project");
  });

  test("writePrd should format JSON with indentation", async () => {
    await repository.writePrd(TEST_PRD);
    const fileContent = Bun.file(TEST_PRD_PATH).text();

    const content = await fileContent;
    expect(content).toContain("  \"project\"");
    expect(content).toContain("  \"backlog\"");
  });

  test("readPrd should handle empty backlog", async () => {
    const emptyPrd = {
      project: "Empty Project",
      backlog: []
    };

    await repository.writePrd(emptyPrd);
    const prd = await repository.readPrd();

    expect(prd.backlog).toHaveLength(0);
  });
});
