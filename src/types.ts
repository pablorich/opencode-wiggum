export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskCategory = "infrastructure" | "feature" | "bugfix" | "refactor" | "docs";

export interface Task {
  id: string;
  priority: number;
  feature: string;
  status: TaskStatus;
  category: TaskCategory;
  createdAt: string;
  completedAt: string | null;
  completedBy: "manual" | "opencode" | null;
  dependencies: string[];
  notes: string | null;
}

export interface Prd {
  project: string;
  backlog: Task[];
}
