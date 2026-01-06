#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync } from "fs";
import { join } from "path";
import { VERSION } from "./version.js";

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.log(`
Wiggum - Automated task completion using OpenCode and Bun

Usage:
  wiggum [prd-path] [max-iterations]
  
Arguments:
  prd-path         Optional path to prd.json file (default: ./plans/prd.json)
  max-iterations    Maximum number of iterations (default: 10)

Options:
  --version, -v    Show version number and exit
  --help, -h       Show this help message and exit

Examples:
  wiggum                           # Run with default settings
  wiggum ./my-prd.json              # Use custom PRD file
  wiggum ./my-prd.json 20           # Run with 20 max iterations
  wiggum 20                         # Use default PRD, 20 iterations
  
Environment:
  Works in the current directory (like git)
  Looks for plans/prd.json by default
  Creates/updates progress.txt in current directory
  `);
  process.exit(0);
}

if (args[0] === "--version" || args[0] === "-v") {
  console.log(`wiggum ${VERSION}`);
  process.exit(0);
}

const CUSTOM_PRD_PATH = args[0];
const MAX_ITERATIONS = parseInt(args[1]) || 10;

const PRD_PATH = CUSTOM_PRD_PATH || join(process.cwd(), "plans/prd.json");
const LOG_PATH = join(process.cwd(), "progress.txt");

async function runWiggum() {
  console.log("🚀 Ralph Wiggum Loop: Initializing with OpenCode and Bun");

  for (let i = 1; i <= MAX_ITERATIONS; i++) {
    console.log(`\n--- Iteration ${i} ---`);

    if (!existsSync(PRD_PATH)) {
      console.error(`Missing prd.json at ${PRD_PATH}`);
      process.exit(1);
    }

    const tasksOutput = await $`PRD_PATH=${PRD_PATH} task list`.text();

    const prompt = `
      Context: @${LOG_PATH}
      
      Tasks:
      ${tasksOutput}
      
      CRITICAL: You are in an automated loop. Complete exactly ONE task, then STOP. Do NOT check for more work. Do NOT continue to next task. Let the loop restart you in a fresh session.
      
      Task:
      1. Choose highest priority task from the available tasks list.
      2. If it is environment setup, perform it now (install deps, config files).
      3. For any feature, verify using 'bunx tsc --noEmit' and 'bun test'.
      4. If successful: 
         - Mark the task as complete by running 'task complete <id>'.
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
