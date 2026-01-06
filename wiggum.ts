import { $ } from "bun";
import { existsSync } from "fs";

const PRD_PATH = "plans/prd.json";
const LOG_PATH = "progress.txt";
const MAX_ITERATIONS = parseInt(process.argv[2]) || 10;

async function runWiggum() {
  console.log("🚀 Ralph Wiggum Loop: Initializing with OpenCode and Bun");

  for (let i = 1; i <= MAX_ITERATIONS; i++) {
    console.log(`\n--- Iteration ${i} ---`);

    if (!existsSync(PRD_PATH)) {
      console.error("Missing prd.json in plans/ directory.");
      process.exit(1);
    }

    const tasksOutput = await $`bun run src/task-cli.ts list`.text();

    const prompt = `
      Context: @${LOG_PATH}
      
      Tasks:
      ${tasksOutput}
      
      CRITICAL: You are in an automated loop. Complete exactly ONE task, then STOP. Do NOT check for more work. Do NOT continue to next task. Let the loop restart you in a fresh session.
      
      Task:
      1. Choose the highest priority task from the available tasks list.
      2. If it is environment setup, perform it now (install deps, config files).
      3. For any feature, verify using 'bunx tsc --noEmit' and 'bun test'.
      4. If successful: 
         - Mark the task as complete using 'bun run task complete <id>'.
         - Record details in ${LOG_PATH}.
         - Create a git commit.
         - STOP HERE. Do not check for tasks again. Do not look for next task.
      5. If there are no available tasks to work on, respond with: <promise>COMPLETE</promise>.
      
      After completing one task, simply report completion with a brief summary. Do not check for tasks again. Do not check for next task. The loop will call you again.
    `;

    const result = await $`opencode run -m opencode/glm-4.7-free ${prompt}`.text();
    
    console.log(result);

    if (result.includes("<promise>COMPLETE</promise>")) {
      console.log("✅ PRD fully implemented.");
      break;
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
}

runWiggum().catch(console.error);
