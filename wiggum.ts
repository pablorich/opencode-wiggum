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

    // The prompt instructs AI to prioritize testing setup as defined in PRD.
    const prompt = `
      Context: @${PRD_PATH} @${LOG_PATH}
      
      CRITICAL: You are in an automated loop. Complete exactly ONE task, then STOP. Do NOT check for more work. Do NOT continue to next task. Let the loop restart you in a fresh session.
      
      Task:
      1. Choose the highest priority task in ${PRD_PATH} where 'status' is not 'completed' and all dependencies are 'completed'.
      2. If it is environment setup, perform it now (install deps, config files).
      3. For any feature, verify using 'bunx tsc --noEmit' and 'bun test'.
      4. If successful: 
         - Set 'status' to 'completed'.
         - Set 'completedAt' to current ISO timestamp.
         - Set 'completedBy' to 'opencode'.
         - Record details in ${LOG_PATH}.
         - Create a git commit.
         - STOP HERE. Do not check PRD again. Do not look for next task.
      5. If the entire PRD is done (no remaining uncompleted tasks), respond with: <promise>COMPLETE</promise>.
      
      After completing one task, simply report completion with a brief summary. Do not look at PRD again. Do not check for next task. The loop will call you again.
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
