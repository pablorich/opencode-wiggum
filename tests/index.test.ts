import { add } from "../src/index.js";

test("adds two positive numbers", () => {
  expect(add(2, 3)).toBe(5);
});

test("adds negative numbers", () => {
  expect(add(-1, -2)).toBe(-3);
});

test("handles zero", () => {
  expect(add(0, 5)).toBe(5);
  expect(add(5, 0)).toBe(5);
});
