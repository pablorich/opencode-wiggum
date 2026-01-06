#!/usr/bin/env bun
import type { Task, TaskStatus, TaskCategory } from "./types.js";

const PRD_PATH = "plans/prd.json";

async function readPrd(): Promise<{ project: string; backlog: Task[] }> {
  const file = Bun.file(PRD_PATH);
  const text = await file.text();
  return JSON.parse(text);
}

async function writePrd(prd: { project: string; backlog: Task[] }): Promise<void> {
  await Bun.write(PRD_PATH, JSON.stringify(prd, null, 2));
}

function inferCategory(description: string): TaskCategory {
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

function getNextId(tasks: Task[]): string {
  const maxId = tasks.reduce((max, task) => {
    const id = parseInt(task.id);
    return id > max ? id : max;
  }, 0);
  return String(maxId + 1);
}

async function addTask(): Promise<void> {
  const prd = await readPrd();
  
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
  
  const now = new Date().toISOString();
  const newTask: Task = {
    id: getNextId(prd.backlog),
    priority,
    feature,
    status: "pending",
    category,
    createdAt: now,
    completedAt: null,
    completedBy: "manual",
    dependencies,
    notes
  };
  
  prd.backlog.push(newTask);
  await writePrd(prd);
  console.log(`✅ Task ${newTask.id} added successfully.`);
}

async function listTasks(): Promise<void> {
  const args = process.argv.slice(3);
  let filterStatus: TaskStatus | null = null;
  let filterCategory: TaskCategory | null = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--status" && args[i + 1]) {
      filterStatus = args[i + 1] as TaskStatus;
      i++;
    }
    if (args[i] === "--category" && args[i + 1]) {
      filterCategory = args[i + 1] as TaskCategory;
      i++;
    }
  }
  
  const prd = await readPrd();
  let tasks = prd.backlog;
  
  if (filterStatus) tasks = tasks.filter(t => t.status === filterStatus);
  if (filterCategory) tasks = tasks.filter(t => t.category === filterCategory);
  
  tasks.sort((a, b) => a.priority - b.priority);
  
  if (tasks.length === 0) {
    console.log("No tasks found.");
    return;
  }
  
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
}

async function updateTask(taskId: string): Promise<void> {
  const prd = await readPrd();
  const task = prd.backlog.find(t => t.id === taskId);
  
  if (!task) {
    console.error(`❌ Task #${taskId} not found.`);
    process.exit(1);
  }
  
  console.log(`Updating task #${taskId}`);
  console.log(`Current: ${task.feature}`);
  console.log(`Status: ${task.status} | Category: ${task.category} | Priority: ${task.priority}`);
  
  const feature = await prompt(`Description (current: ${task.feature}): `) || task.feature;
  const priorityStr = await prompt(`Priority (current: ${task.priority}): `);
  const priority = priorityStr.trim() ? parseInt(priorityStr) : task.priority;
  
  const categoryOptions: TaskCategory[] = ["infrastructure", "feature", "bugfix", "refactor", "docs"];
  console.log("Categories:", categoryOptions.join(", "));
  const categoryInput = await prompt(`Category (current: ${task.category}): `);
  const category: TaskCategory = categoryInput.trim() ? categoryInput.trim() as TaskCategory : task.category;
  
  const statusOptions: TaskStatus[] = ["pending", "in_progress", "completed"];
  console.log("Status:", statusOptions.join(", "));
  const statusInput = await prompt(`Status (current: ${task.status}): `);
  let status: TaskStatus = statusInput.trim() ? statusInput.trim() as TaskStatus : task.status;
  
  let completedAt = task.completedAt;
  let completedBy = task.completedBy;
  
  if (status === "completed" && task.status !== "completed") {
    completedAt = new Date().toISOString();
    completedBy = "manual";
  } else if (status !== "completed") {
    completedAt = null;
    completedBy = null;
  }
  
  const depsInput = await prompt(`Dependencies (current: ${task.dependencies.join(", ") || "none"}): `);
  const dependencies = depsInput.trim() ? depsInput.split(",").map(d => d.trim()) : task.dependencies;
  
  const notesInput = await prompt(`Notes (current: ${task.notes || "none"}): `);
  const notes = notesInput.trim() ? notesInput : task.notes;
  
  Object.assign(task, {
    feature,
    priority,
    category,
    status,
    completedAt,
    completedBy,
    dependencies,
    notes
  });
  
  await writePrd(prd);
  console.log(`✅ Task #${taskId} updated successfully.`);
}

async function completeTask(taskId: string): Promise<void> {
  const prd = await readPrd();
  const task = prd.backlog.find(t => t.id === taskId);
  
  if (!task) {
    console.error(`❌ Task #${taskId} not found.`);
    process.exit(1);
  }
  
  for (const depId of task.dependencies) {
    const dep = prd.backlog.find(t => t.id === depId);
    if (!dep) {
      console.error(`❌ Dependency #${depId} does not exist.`);
      process.exit(1);
    }
    if (dep.status !== "completed") {
      console.error(`❌ Dependency #${depId} is not completed.`);
      process.exit(1);
    }
  }
  
  task.status = "completed";
  task.completedAt = new Date().toISOString();
  task.completedBy = "manual";
  
  await writePrd(prd);
  console.log(`✅ Task #${taskId} marked as completed.`);
}

async function showStatus(): Promise<void> {
  const prd = await readPrd();
  const tasks = prd.backlog;
  
  const pending = tasks.filter(t => t.status === "pending").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const completed = tasks.filter(t => t.status === "completed").length;
  
  console.log(`\n📊 Task Summary`);
  console.log(`Total: ${tasks.length} | Pending: ${pending} | In Progress: ${inProgress} | Completed: ${completed}`);
  
  const completedTasks = tasks
    .filter(t => t.status === "completed" && t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 5);
  
  if (completedTasks.length > 0) {
    console.log(`\n🕐 Recently completed:`);
    for (const task of completedTasks) {
      console.log(`  #${task.id} - ${task.feature} (${new Date(task.completedAt!).toLocaleDateString()})`);
    }
  }
}

function prompt(question: string): Promise<string> {
  process.stdout.write(question);
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const data: string[] = [];
    stdin.on("data", (chunk) => data.push(chunk.toString()));
    stdin.once("end", () => resolve(data.join("").trim()));
  });
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
  list      List all tasks (options: --status <pending|in_progress|completed> --category <type>)
  update    Update a task (usage: bun run task update <id>)
  complete  Mark a task as complete (usage: bun run task complete <id>)
  status    Show task summary
      `);
  }
}

main().catch(console.error);
