import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
const version = packageJson.version;

console.log(`Building wiggum version ${version}`);

writeFileSync("bin/version.ts", `export const VERSION = "${version}";\n`);

try {
  execSync(`bun build bin/wiggum.ts --outfile bin/wiggum --compile`, { stdio: "inherit" });
  console.log("✓ Built wiggum");
} catch (error) {
  console.error("✗ Failed to build wiggum");
  process.exit(1);
}

try {
  execSync(`bun build bin/task.ts --outfile bin/task --compile`, { stdio: "inherit" });
  console.log("✓ Built task");
} catch (error) {
  console.error("✗ Failed to build task");
  process.exit(1);
}

console.log(`\n✓ Build complete (version ${version})`);
