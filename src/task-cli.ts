#!/usr/bin/env bun
import type { TaskStatus, TaskCategory } from "./types.js";
import { inferCategory, prompt } from "./utils.js";
import { TaskManager } from "./task-manager.js";
import { TaskRepository } from "./task-repository.js";

const prdPath = process.env.PRD_PATH || "plans/prd.json";
const manager = new TaskManager(new TaskRepository(prdPath));

async function addTask(): Promise<void> {
  console.log("Adding new task...");
  const feature = await prompt("Description: ");
  const priorityStr = await prompt("Priority (1-5): ");
  const priority = parseInt(priorityStr);

  const categoryOptions: TaskCategory[] = ["infrastructure", "feature", "bugfix", "refactor", "docs"];
  console.log("Categories:", categoryOptions.join(", "));
  const categoryInput = await prompt(`Category (default: ${inferCategory(feature)}): `);
  const category: TaskCategory = categoryInput.trim() ? categoryInput.trim() as TaskCategory : inferCategory(feature);

  const depsInput = await prompt("Dependencies (comma-separated task IDs, or empty): ");
  const dependencies = depsInput.trim() ? depsInput.split(",").map(d => d.trim()) : [];

  const notes = await prompt("Notes (optional, or empty): ") || null;

  const newTask = await manager.addTask(feature, priority, category, dependencies, notes);
  console.log(`✅ Task ${newTask.id} added successfully.`);
}

async function listTasks(): Promise<void> {
  const args = process.argv.slice(3);
  let filterStatus: TaskStatus | undefined;
  let filterCategory: TaskCategory | undefined;
  let showAll = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--all") {
      showAll = true;
    }
    if (args[i] === "--status" && args[i + 1]) {
      filterStatus = args[i + 1] as TaskStatus;
      i++;
    }
    if (args[i] === "--category" && args[i + 1]) {
      filterCategory = args[i + 1] as TaskCategory;
      i++;
    }
  }

  const tasks = await manager.listTasks(filterStatus, filterCategory);

  if (tasks.length === 0) {
    console.log("No tasks found.");
    return;
  }

  if (showAll || filterStatus || filterCategory) {
    const statusEmoji = {
      pending: "⏳",
      in_progress: "🔄",
      completed: "✅"
    };

    for (const task of tasks) {
      const completed = task.completedAt ? ` (completed: ${new Date(task.completedAt).toLocaleDateString()})` : "";
      const deps = task.dependencies.length > 0 ? ` [deps: ${task.dependencies.join(", ")}]` : "";
      console.log(`${statusEmoji[task.status]} #${task.id} (P${task.priority}) [${task.category}] ${task.feature}${completed}${deps}`);
      if (task.notes) console.log(`   └─ ${task.notes}`);
    }
  } else {
    const status = await manager.getStatus();
    const readyTasks = await manager.getReadyTasks();

    if (status.recentlyCompleted.length > 0) {
      console.log("\n🕐 Recently completed:");
      for (const task of status.recentlyCompleted) {
        console.log(`  ✅ #${task.id} (P${task.priority}) [${task.category}] ${task.feature}`);
      }
    }

    if (readyTasks.length > 0) {
      console.log("\n📋 Available tasks (no pending dependencies):");
      for (const task of readyTasks) {
        const deps = task.dependencies.length > 0 ? ` [deps: ${task.dependencies.join(", ")}]` : "";
        console.log(`  ⏳ #${task.id} (P${task.priority}) [${task.category}] ${task.feature}${deps}`);
        if (task.notes) console.log(`     └─ ${task.notes}`);
      }
    } else {
      console.log("\n📋 No available tasks (all pending tasks have unresolved dependencies)");
    }
  }
}

async function updateTask(taskId: string): Promise<void> {
  const tasks = await manager.listTasks();
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    console.error(`❌ Task #${taskId} not found.`);
    process.exit(1);
  }

  console.log(`Updating task #${taskId}`);
  console.log(`Current: ${task.feature}`);
  console.log(`Status: ${task.status} | Category: ${task.category} | Priority: ${task.priority}`);

  const feature = await prompt(`Description (current: ${task.feature}): `);
  const priorityStr = await prompt(`Priority (current: ${task.priority}): `);
  const priority = priorityStr.trim() ? parseInt(priorityStr) : task.priority;

  const categoryOptions: TaskCategory[] = ["infrastructure", "feature", "bugfix", "refactor", "docs"];
  console.log("Categories:", categoryOptions.join(", "));
  const categoryInput = await prompt(`Category (current: ${task.category}): `);
  const category: TaskCategory = categoryInput.trim() ? categoryInput.trim() as TaskCategory : task.category;

  const statusOptions: TaskStatus[] = ["pending", "in_progress", "completed"];
  console.log("Status:", statusOptions.join(", "));
  const statusInput = await prompt(`Status (current: ${task.status}): `);
  const status = statusInput.trim() ? statusInput.trim() as TaskStatus : task.status;

  const depsInput = await prompt(`Dependencies (current: ${task.dependencies.join(", ") || "none"}): `);
  const dependencies = depsInput.trim() ? depsInput.split(",").map(d => d.trim()) : task.dependencies;

  const notesInput = await prompt(`Notes (current: ${task.notes || "none"}): `);
  const notes = notesInput.trim() ? notesInput : task.notes;

  const updates: Parameters<typeof manager.updateTask>[1] = {};
  if (feature) updates.feature = feature;
  if (!isNaN(priority)) updates.priority = priority;
  if (category) updates.category = category;
  if (status) updates.status = status;
  if (depsInput.trim()) updates.dependencies = dependencies;
  if (notesInput.trim()) updates.notes = notes;

  const updated = await manager.updateTask(taskId, updates);
  if (updated) {
    console.log(`✅ Task #${taskId} updated successfully.`);
  } else {
    console.error(`❌ Failed to update task #${taskId}.`);
  }
}

async function completeTask(taskId: string): Promise<void> {
  const result = await manager.completeTask(taskId);

  if (!result) {
    console.error(`❌ Failed to complete task #${taskId}. Task not found or dependencies not satisfied.`);
    process.exit(1);
  }

  console.log(`✅ Task #${taskId} marked as completed.`);
}

async function showStatus(): Promise<void> {
  const status = await manager.getStatus();

  console.log(`\n📊 Task Summary`);
  console.log(`Total: ${status.total} | Pending: ${status.pending} | In Progress: ${status.inProgress} | Completed: ${status.completed}`);

  if (status.recentlyCompleted.length > 0) {
    console.log(`\n🕐 Recently completed:`);
    for (const task of status.recentlyCompleted) {
      console.log(`  #${task.id} - ${task.feature} (${new Date(task.completedAt!).toLocaleDateString()})`);
    }
  }
}

const command = process.argv[2];

async function main() {
  switch (command) {
    case "add":
      await addTask();
      break;
    case "list":
      await listTasks();
      break;
    case "update":
      if (!process.argv[3]) {
        console.error("Usage: bun run task update <id>");
        process.exit(1);
      }
      await updateTask(process.argv[3]);
      break;
    case "complete":
      if (!process.argv[3]) {
        console.error("Usage: bun run task complete <id>");
        process.exit(1);
      }
      await completeTask(process.argv[3]);
      break;
    case "status":
      await showStatus();
      break;
    default:
      console.log(`
Usage: bun run task <command>

Commands:
  add       Add a new task
  list      List available tasks (default: recently completed + ready tasks, --all: show all)
            Options: --all, --status <pending|in_progress|completed> --category <type>
  update    Update a task (usage: bun run task update <id>)
  complete  Mark a task as complete (usage: bun run task complete <id>)
  status    Show task summary
      `);
  }
}

main().catch(console.error);
