import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { TaskManager } from "../src/task-manager";
import { TaskRepository } from "../src/task-repository";
import { unlinkSync, existsSync, writeFileSync } from "fs";
import { join } from "path";

const TEST_PRD_PATH = join(import.meta.dir, "test-task-manager.json");

const INITIAL_PRD = {
  project: "Test Project",
  backlog: []
};

describe("TaskManager", () => {
  let manager: TaskManager;

  beforeEach(() => {
    const repository = new TaskRepository(TEST_PRD_PATH);
    manager = new TaskManager(repository);
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

  test("addTask should create new task", async () => {
    const task = await manager.addTask("New task", 2, "feature");

    expect(task.id).toBe("1");
    expect(task.feature).toBe("New task");
    expect(task.priority).toBe(2);
    expect(task.status).toBe("pending");
    expect(task.category).toBe("feature");
    expect(task.completedAt).toBeNull();
    expect(task.completedBy).toBeNull();
  });

  test("addTask should generate sequential IDs", async () => {
    const task1 = await manager.addTask("Task 1", 1, "feature");
    const task2 = await manager.addTask("Task 2", 1, "feature");

    expect(task1.id).toBe("1");
    expect(task2.id).toBe("2");
  });

  test("listTasks should return all tasks sorted by priority", async () => {
    await manager.addTask("Medium priority", 2, "feature");
    await manager.addTask("Low priority", 3, "feature");
    await manager.addTask("High priority", 1, "feature");

    const tasks = await manager.listTasks();

    expect(tasks).toHaveLength(3);
    expect(tasks[0].priority).toBe(1);
    expect(tasks[1].priority).toBe(2);
    expect(tasks[2].priority).toBe(3);
  });

  test("listTasks should filter by status", async () => {
    await manager.addTask("Pending task", 1, "feature");
    const task = await manager.addTask("New task", 2, "feature");
    await manager.completeTask(task.id);

    const pendingTasks = await manager.listTasks("pending");
    const completedTasks = await manager.listTasks("completed");

    expect(pendingTasks).toHaveLength(1);
    expect(completedTasks).toHaveLength(1);
  });

  test("listTasks should filter by category", async () => {
    await manager.addTask("Feature task 1", 1, "feature");
    await manager.addTask("Feature task 2", 2, "feature");
    await manager.addTask("Bug task", 3, "bugfix");

    const featureTasks = await manager.listTasks(undefined, "feature");
    const bugfixTasks = await manager.listTasks(undefined, "bugfix");

    expect(featureTasks).toHaveLength(2);
    expect(bugfixTasks).toHaveLength(1);
  });

  test("updateTask should update task fields", async () => {
    const task = await manager.addTask("Original", 2, "feature");
    const updated = await manager.updateTask(task.id, {
      feature: "Updated",
      priority: 3,
      category: "bugfix"
    });

    expect(updated?.feature).toBe("Updated");
    expect(updated?.priority).toBe(3);
    expect(updated?.category).toBe("bugfix");
  });

  test("updateTask should return null for non-existent task", async () => {
    const result = await manager.updateTask("999", { feature: "Updated" });
    expect(result).toBeNull();
  });

  test("updateTask should set completedAt when marking as completed", async () => {
    const task = await manager.addTask("Task to complete", 1, "feature");
    const updated = await manager.updateTask(task.id, { status: "completed" });

    expect(updated?.status).toBe("completed");
    expect(updated?.completedAt).not.toBeNull();
    expect(updated?.completedBy).toBe("manual");
  });

  test("updateTask should clear completedAt when unmarking completion", async () => {
    const task = await manager.addTask("Task", 1, "feature");
    await manager.completeTask(task.id);
    const updated = await manager.updateTask(task.id, { status: "pending" });

    expect(updated?.completedAt).toBeNull();
    expect(updated?.completedBy).toBeNull();
  });

  test("completeTask should mark task as completed", async () => {
    const task = await manager.addTask("Task", 1, "feature");
    const result = await manager.completeTask(task.id);

    expect(result).toBe(true);

    const updatedTask = (await manager.listTasks()).find(t => t.id === task.id);
    expect(updatedTask?.status).toBe("completed");
  });

  test("completeTask should set completion metadata", async () => {
    const task = await manager.addTask("Task", 1, "feature");
    await manager.completeTask(task.id);

    const updatedTask = (await manager.listTasks()).find(t => t.id === task.id);
    expect(updatedTask?.completedAt).not.toBeNull();
    expect(updatedTask?.completedBy).toBe("manual");
  });

  test("completeTask should return false for non-existent task", async () => {
    const result = await manager.completeTask("999");
    expect(result).toBe(false);
  });

  test("completeTask should validate dependencies", async () => {
    const dep = await manager.addTask("Dependency", 1, "feature");
    const task = await manager.addTask("Task with deps", 2, "feature", [dep.id]);

    const result = await manager.completeTask(task.id);
    expect(result).toBe(false);

    await manager.completeTask(dep.id);
    const result2 = await manager.completeTask(task.id);
    expect(result2).toBe(true);
  });

  test("completeTask should return false for missing dependencies", async () => {
    const task = await manager.addTask("Task", 1, "feature", ["999"]);
    const result = await manager.completeTask(task.id);
    expect(result).toBe(false);
  });

  test("getStatus should return correct summary", async () => {
    await manager.addTask("Pending", 2, "feature");
    const task2 = await manager.addTask("To complete", 3, "feature");
    await manager.completeTask(task2.id);

    const status = await manager.getStatus();

    expect(status.total).toBe(2);
    expect(status.pending).toBe(1);
    expect(status.completed).toBe(1);
  });

  test("getStatus should include recently completed tasks", async () => {
    const task = await manager.addTask("Task", 1, "feature");
    await manager.completeTask(task.id);

    const status = await manager.getStatus();

    expect(status.recentlyCompleted).toHaveLength(1);
    expect(status.recentlyCompleted[0].id).toBe(task.id);
  });

  test("deleteTask should remove task", async () => {
    const task = await manager.addTask("Task to delete", 1, "feature");
    const result = await manager.deleteTask(task.id);

    expect(result).toBe(true);

    const tasks = await manager.listTasks();
    expect(tasks.find(t => t.id === task.id)).toBeUndefined();
  });

  test("deleteTask should return false for non-existent task", async () => {
    const result = await manager.deleteTask("999");
    expect(result).toBe(false);
  });

  test("getReadyTasks should return tasks with no dependencies", async () => {
    const ready1 = await manager.addTask("Ready task 1", 2, "feature");
    const ready2 = await manager.addTask("Ready task 2", 1, "feature");

    const readyTasks = await manager.getReadyTasks();

    expect(readyTasks).toHaveLength(2);
    expect(readyTasks.map(t => t.id)).toContain(ready1.id);
    expect(readyTasks.map(t => t.id)).toContain(ready2.id);
  });

  test("getReadyTasks should sort by priority", async () => {
    await manager.addTask("Low priority", 3, "feature");
    await manager.addTask("High priority", 1, "feature");
    await manager.addTask("Medium priority", 2, "feature");

    const readyTasks = await manager.getReadyTasks();

    expect(readyTasks[0].priority).toBe(1);
    expect(readyTasks[1].priority).toBe(2);
    expect(readyTasks[2].priority).toBe(3);
  });

  test("getReadyTasks should filter out tasks with unmet dependencies", async () => {
    const dep = await manager.addTask("Dependency", 1, "feature");
    await manager.addTask("Task with unmet deps", 2, "feature", [dep.id]);

    const readyTasks = await manager.getReadyTasks();

    expect(readyTasks).toHaveLength(1);
    expect(readyTasks[0].id).toBe(dep.id);
  });

  test("getReadyTasks should include tasks with met dependencies", async () => {
    const dep = await manager.addTask("Dependency", 1, "feature");
    const task = await manager.addTask("Task with met deps", 2, "feature", [dep.id]);

    await manager.completeTask(dep.id);

    const readyTasks = await manager.getReadyTasks();

    expect(readyTasks).toHaveLength(1);
    expect(readyTasks[0].id).toBe(task.id);
  });

  test("getReadyTasks should filter out completed tasks", async () => {
    const completed = await manager.addTask("Completed task", 1, "feature");
    const pending = await manager.addTask("Pending task", 2, "feature");

    await manager.completeTask(completed.id);

    const readyTasks = await manager.getReadyTasks();

    expect(readyTasks).toHaveLength(1);
    expect(readyTasks[0].id).toBe(pending.id);
  });

  test("getReadyTasks should handle complex dependency chains", async () => {
    const a = await manager.addTask("Task A", 1, "feature");
    const b = await manager.addTask("Task B", 2, "feature", [a.id]);
    const c = await manager.addTask("Task C", 3, "feature", [b.id]);

    const readyTasks = await manager.getReadyTasks();
    expect(readyTasks.map(t => t.id)).toEqual([a.id]);

    await manager.completeTask(a.id);
    const readyTasks2 = await manager.getReadyTasks();
    expect(readyTasks2.map(t => t.id)).toEqual([b.id]);

    await manager.completeTask(b.id);
    const readyTasks3 = await manager.getReadyTasks();
    expect(readyTasks3.map(t => t.id)).toEqual([c.id]);
  });

  test("getReadyTasks should handle multiple dependencies", async () => {
    const dep1 = await manager.addTask("Dependency 1", 1, "feature");
    const dep2 = await manager.addTask("Dependency 2", 2, "feature");
    await manager.addTask("Task with multiple deps", 3, "feature", [dep1.id, dep2.id]);

    const readyTasks = await manager.getReadyTasks();
    expect(readyTasks.map(t => t.id)).toEqual([dep1.id, dep2.id]);
  });

  test("getReadyTasks should return empty array when no tasks are ready", async () => {
    const task1 = await manager.addTask("Task 1", 1, "feature");
    const task2 = await manager.addTask("Task 2", 2, "feature", ["999"]);
    await manager.addTask("Task 3", 3, "feature", [task1.id, task2.id]);

    const readyTasks = await manager.getReadyTasks();

    expect(readyTasks).toHaveLength(1);
    expect(readyTasks[0].id).toBe(task1.id);
  });
});
