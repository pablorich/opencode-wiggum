# Project Overview

NaturalScrapper is a web scraping tool built with TypeScript and Bun, designed to extract structured data from web pages efficiently.

## Project State

**Status:** Early development - core infrastructure complete
**Framework:** TypeScript 5.3.3, Bun 1.3.5
**Build System:** Bun native runner and test framework

## Core Components

### `src/index.ts`

Main entry point. Currently contains a sample `add` function used for testing infrastructure.

### `tests/index.test.ts`

Test suite with 3 sample tests demonstrating the testing setup. Uses Bun's native test framework.

### `tests/bun-test.d.ts`

Type declarations for Bun test globals (test, expect, describe) to provide TypeScript support.

### `package.json`

Defines project dependencies and scripts:

- `bun test`: Run test suite
- `bun x tsc --noEmit`: Type checking

### `tsconfig.json`

TypeScript configuration with:

- Strict mode enabled
- ES2022 target
- ESNext module system
- Includes both `src/` and `tests/` directories

## Infrastructure

**Testing:** Bun's native test framework with `test()` and `expect()` globals
**Type Checking:** TypeScript compiler with noEmit flag
**Package Manager:** Bun (lockfile: bun.lock)

## Development Workflow

1. Make changes to source code
2. Run `bun test` to verify tests pass
3. Run `bun run typecheck` to verify type safety
4. Update progress.txt and plans/prd.json
5. Update AGENTS.md file. It should have a brief description of the project state and components meant to be read by an LLM, with the purpose to feed context more efficiently than by loading complete files.
6. Commit changes

## Notes

- Sample `add` function in `src/index.ts` is temporary placeholder for testing
- No external scraping libraries implemented yet
- Project is ready for core scraping logic implementation
