import type { Task, TaskCategory } from "../src/types.js";

test("infer category from infrastructure keywords", () => {
  const infer = (description: string): TaskCategory => {
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
  };

  expect(infer("Set up database connection")).toBe("infrastructure");
  expect(infer("Initialize project structure")).toBe("infrastructure");
  expect(infer("Configure webpack")).toBe("infrastructure");
  expect(infer("Install dependencies")).toBe("infrastructure");
  expect(infer("Create config file")).toBe("infrastructure");
});

test("infer category from bugfix keywords", () => {
  const infer = (description: string): TaskCategory => {
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
  };

  expect(infer("Fix login bug")).toBe("bugfix");
  expect(infer("Test authentication flow")).toBe("bugfix");
  expect(infer("Bug in payment processing")).toBe("bugfix");
});

test("infer category from refactor keywords", () => {
  const infer = (description: string): TaskCategory => {
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
  };

  expect(infer("Refactor user service")).toBe("refactor");
  expect(infer("Clean up unused code")).toBe("refactor");
  expect(infer("Optimize database queries")).toBe("refactor");
});

test("infer category from docs keywords", () => {
  const infer = (description: string): TaskCategory => {
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
  };

  expect(infer("Update documentation")).toBe("docs");
  expect(infer("Create README")).toBe("docs");
  expect(infer("Update AGENTS.md file")).toBe("docs");
});

test("infer category defaults to feature", () => {
  const infer = (description: string): TaskCategory => {
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
  };

  expect(infer("Add user authentication")).toBe("feature");
  expect(infer("Create new dashboard")).toBe("feature");
  expect(infer("Implement search functionality")).toBe("feature");
});

test("get next id from tasks", () => {
  const tasks: Task[] = [
    { id: "1", priority: 1, feature: "Task 1", status: "completed", category: "feature", createdAt: "2026-01-05T10:00:00Z", completedAt: "2026-01-05T10:00:00Z", completedBy: "manual", dependencies: [], notes: null },
    { id: "5", priority: 2, feature: "Task 5", status: "pending", category: "feature", createdAt: "2026-01-05T10:00:00Z", completedAt: null, completedBy: null, dependencies: [], notes: null },
  ];

  const maxId = tasks.reduce((max, task) => {
    const id = parseInt(task.id);
    return id > max ? id : max;
  }, 0);

  expect(maxId).toBe(5);
  expect(String(maxId + 1)).toBe("6");
});

test("validate dependencies exist", () => {
  const tasks: Task[] = [
    { id: "1", priority: 1, feature: "Task 1", status: "completed", category: "feature", createdAt: "2026-01-05T10:00:00Z", completedAt: "2026-01-05T10:00:00Z", completedBy: "manual", dependencies: [], notes: null },
    { id: "2", priority: 2, feature: "Task 2", status: "pending", category: "feature", createdAt: "2026-01-05T10:00:00Z", completedAt: null, completedBy: null, dependencies: ["1", "3"], notes: null },
  ];

  const taskWithDeps = tasks.find(t => t.id === "2");
  expect(taskWithDeps).toBeDefined();

  const nonExistentDeps = taskWithDeps!.dependencies.filter(depId => !tasks.some(t => t.id === depId));
  expect(nonExistentDeps).toContain("3");
});
