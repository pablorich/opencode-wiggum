import type { Task, TaskStatus, TaskCategory } from "./types.js";
import { TaskRepository } from "./task-repository.js";

export class TaskManager {
  private repository: TaskRepository;

  constructor(repository: TaskRepository = new TaskRepository()) {
    this.repository = repository;
  }

  private getNextId(tasks: Task[]): string {
    const maxId = tasks.reduce((max, task) => {
      const id = parseInt(task.id);
      return id > max ? id : max;
    }, 0);
    return String(maxId + 1);
  }

  async addTask(
    feature: string,
    priority: number,
    category: TaskCategory,
    dependencies: string[] = [],
    notes: string | null = null
  ): Promise<Task> {
    const prd = await this.repository.readPrd();
    const now = new Date().toISOString();

    const newTask: Task = {
      id: this.getNextId(prd.backlog),
      priority,
      feature,
      status: "pending",
      category,
      createdAt: now,
      completedAt: null,
      completedBy: null,
      dependencies,
      notes
    };

    prd.backlog.push(newTask);
    await this.repository.writePrd(prd);

    return newTask;
  }

  async listTasks(
    filterStatus?: TaskStatus,
    filterCategory?: TaskCategory
  ): Promise<Task[]> {
    const prd = await this.repository.readPrd();
    let tasks = prd.backlog;

    if (filterStatus) tasks = tasks.filter(t => t.status === filterStatus);
    if (filterCategory) tasks = tasks.filter(t => t.category === filterCategory);

    return tasks.sort((a, b) => a.priority - b.priority);
  }

  async updateTask(
    taskId: string,
    updates: Partial<{
      feature: string;
      priority: number;
      category: TaskCategory;
      status: TaskStatus;
      dependencies: string[];
      notes: string | null;
    }>
  ): Promise<Task | null> {
    const prd = await this.repository.readPrd();
    const task = prd.backlog.find(t => t.id === taskId);

    if (!task) {
      return null;
    }

    let completedAt = task.completedAt;
    let completedBy = task.completedBy;

    if (updates.status) {
      if (updates.status === "completed" && task.status !== "completed") {
        completedAt = new Date().toISOString();
        completedBy = "manual";
      } else if (updates.status !== "completed") {
        completedAt = null;
        completedBy = null;
      }
    }

    Object.assign(task, {
      ...updates,
      completedAt,
      completedBy
    });

    await this.repository.writePrd(prd);

    return task;
  }

  async completeTask(taskId: string): Promise<boolean> {
    const prd = await this.repository.readPrd();
    const task = prd.backlog.find(t => t.id === taskId);

    if (!task) {
      return false;
    }

    for (const depId of task.dependencies) {
      const dep = prd.backlog.find(t => t.id === depId);
      if (!dep || dep.status !== "completed") {
        return false;
      }
    }

    task.status = "completed";
    task.completedAt = new Date().toISOString();
    task.completedBy = "manual";

    await this.repository.writePrd(prd);

    return true;
  }

  async getStatus(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    recentlyCompleted: Task[];
  }> {
    const prd = await this.repository.readPrd();
    const tasks = prd.backlog;

    const pending = tasks.filter(t => t.status === "pending").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const completed = tasks.filter(t => t.status === "completed").length;

    const recentlyCompleted = tasks
      .filter(t => t.status === "completed" && t.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5);

    return {
      total: tasks.length,
      pending,
      inProgress,
      completed,
      recentlyCompleted
    };
  }

  async deleteTask(taskId: string): Promise<boolean> {
    const prd = await this.repository.readPrd();
    const index = prd.backlog.findIndex(t => t.id === taskId);

    if (index === -1) {
      return false;
    }

    prd.backlog.splice(index, 1);
    await this.repository.writePrd(prd);

    return true;
  }

  async getReadyTasks(): Promise<Task[]> {
    const prd = await this.repository.readPrd();
    const completedIds = new Set(prd.backlog.filter(t => t.status === "completed").map(t => t.id));

    return prd.backlog
      .filter(t => t.status === "pending" && t.dependencies.every(depId => completedIds.has(depId)))
      .sort((a, b) => a.priority - b.priority);
  }
}
