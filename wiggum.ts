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

    // The prompt instructs the AI to prioritize the testing setup as defined in the PRD.
    const prompt = `
      Context: @${PRD_PATH} @${LOG_PATH}
      Task:
      1. Choose the highest priority task in ${PRD_PATH} where 'passes' is false.
      2. If it is the environment setup, perform it now (install deps, config files).
      3. For any feature, verify using 'bun x tsc --noEmit' and 'bun test'.
      4. If successful: 
         - Update 'passes' to true in ${PRD_PATH}.
         - Record details in ${LOG_PATH}.
         - Create a git commit.
      5. ONLY WORK ON ONE FEATURE PER TURN.
      6. If the entire PRD is done, respond with: <promise>COMPLETE</promise>.
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