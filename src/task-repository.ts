import type { Prd } from "./types.js";

export class TaskRepository {
  private prdPath: string;

  constructor(prdPath: string = "plans/prd.json") {
    this.prdPath = prdPath;
  }

  async readPrd(): Promise<Prd> {
    const file = Bun.file(this.prdPath);
    const text = await file.text();
    return JSON.parse(text);
  }

  async writePrd(prd: Prd): Promise<void> {
    await Bun.write(this.prdPath, JSON.stringify(prd, null, 2));
  }
}
