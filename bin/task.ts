#!/usr/bin/env bun
import type { TaskStatus, TaskCategory } from "../src/types.js";
import { inferCategory, prompt } from "../src/utils.js";
import { TaskManager } from "../src/task-manager.js";
import { TaskRepository } from "../src/task-repository.js";
import { VERSION } from "./version.js";

const args = process.argv.slice(2);
const prdPathIndex = args.indexOf("--prd");
const prdPath = prdPathIndex !== -1 && args[prdPathIndex + 1] ? args[prdPathIndex + 1] : process.env.PRD_PATH || "plans/prd.json";
const manager = new TaskManager(new TaskRepository(prdPath));

const command = args[0];

if (args.length === 0 || command === "--help" || command === "-h") {
  console.log(`
Task CLI - Manage tasks for Wiggum

Usage:
  task <command> [options]

Commands:
  add           Add a new task
  list          List available tasks (default: recently completed + ready tasks)
                 Options:
                   --all                              Show all tasks
                   --status <pending|in_progress|completed> Filter by status
                   --category <type>                    Filter by category
  update <id>   Update a task
  complete <id>  Mark a task as complete
  status         Show task summary

Options:
  --version, -v  Show version number and exit
  --prd <path>   Path to PRD file (default: ./plans/prd.json or PRD_PATH env var)

Examples:
  task add                          Add a new task interactively
  task list                          Show recently completed and ready tasks
  task list --all                    Show all tasks
  task list --status pending           Show only pending tasks
  task complete 5                    Mark task #5 as completed
  task update 3                      Update task #3 interactively
  
Environment:
  Works in the current directory (like git)
  Uses PRD_PATH environment variable or --prd flag for custom location
  Default: ./plans/prd.json
  `);
  process.exit(0);
}

if (command === "--version" || command === "-v") {
  console.log(`task ${VERSION}`);
  process.exit(0);
}

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

async function main() {
  switch (command) {
    case "add":
      await addTask();
      break;
    case "list":
      await listTasks();
      break;
    case "update":
      if (!args[1]) {
        console.error("Usage: task update <id>");
        process.exit(1);
      }
      await updateTask(args[1]);
      break;
    case "complete":
      if (!args[1]) {
        console.error("Usage: task complete <id>");
        process.exit(1);
      }
      await completeTask(args[1]);
      break;
    case "status":
      await showStatus();
      break;
    default:
      console.log(`
Usage: task <command>

Commands:
  add       Add a new task
  list      List available tasks (default: recently completed + ready tasks, --all: show all)
            Options: --all, --status <pending|in_progress|completed> --category <type>
  update    Update a task (usage: task update <id>)
  complete  Mark a task as complete (usage: task complete <id>)
  status    Show task summary
      `);
  }
}

main().catch(console.error);
