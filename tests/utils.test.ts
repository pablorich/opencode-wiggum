import { describe, test, expect } from "bun:test";
import { inferCategory } from "../src/utils";

describe("inferCategory", () => {
  test("should return 'infrastructure' for setup keywords", () => {
    expect(inferCategory("setup the project")).toBe("infrastructure");
    expect(inferCategory("set up the server")).toBe("infrastructure");
    expect(inferCategory("initialize the database")).toBe("infrastructure");
    expect(inferCategory("configure the env")).toBe("infrastructure");
    expect(inferCategory("install dependencies")).toBe("infrastructure");
    expect(inferCategory("create config file")).toBe("infrastructure");
  });

  test("should return 'bugfix' for test/fix/bug keywords", () => {
    expect(inferCategory("write tests for API")).toBe("bugfix");
    expect(inferCategory("fix the login bug")).toBe("bugfix");
    expect(inferCategory("bug in payment flow")).toBe("bugfix");
    expect(inferCategory("test authentication")).toBe("bugfix");
  });

  test("should return 'refactor' for refactor/clean/optimize keywords", () => {
    expect(inferCategory("refactor the code")).toBe("refactor");
    expect(inferCategory("clean up unused code")).toBe("refactor");
    expect(inferCategory("optimize performance")).toBe("refactor");
    expect(inferCategory("refactor component structure")).toBe("refactor");
  });

  test("should return 'docs' for documentation/readme/agents.md keywords", () => {
    expect(inferCategory("update documentation")).toBe("docs");
    expect(inferCategory("write README")).toBe("docs");
    expect(inferCategory("update agents.md")).toBe("docs");
    expect(inferCategory("add docs to AGENTS.md")).toBe("docs");
  });

  test("should return 'feature' as default for other descriptions", () => {
    expect(inferCategory("add user profile page")).toBe("feature");
    expect(inferCategory("implement search functionality")).toBe("feature");
    expect(inferCategory("add export feature")).toBe("feature");
    expect(inferCategory("create dashboard")).toBe("feature");
  });

  test("should be case insensitive", () => {
    expect(inferCategory("SETUP the project")).toBe("infrastructure");
    expect(inferCategory("Fix the BUG")).toBe("bugfix");
    expect(inferCategory("Refactor Code")).toBe("refactor");
    expect(inferCategory("update AGENTS.md")).toBe("docs");
  });

  test("should match keywords at any position", () => {
    expect(inferCategory("project setup initialization")).toBe("infrastructure");
    expect(inferCategory("add test coverage")).toBe("bugfix");
    expect(inferCategory("code refactor needed")).toBe("refactor");
    expect(inferCategory("need better documentation")).toBe("docs");
  });
});
