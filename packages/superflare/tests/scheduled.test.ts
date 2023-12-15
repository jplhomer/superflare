import { describe, expect, test, vi } from "vitest";
import { Task, shouldRunTask } from "../src/scheduled";

describe("shouldRunTask", () => {
  test("runs every minute by default", () => {
    const task = new Task(vi.fn());

    expect(shouldRunTask(task, new Date("2021-01-01T00:00:00"))).toBe(true);
  });

  test("#everyMinute", () => {
    const task = new Task(vi.fn()).everyMinute();

    expect(shouldRunTask(task, new Date("2021-01-01T00:00:00"))).toBe(true);
  });

  test("#hourly runs at 00 minutes", () => {
    const task = new Task(vi.fn()).hourly();

    expect(shouldRunTask(task, new Date("2021-01-01T00:00:00"))).toBe(true);

    expect(shouldRunTask(task, new Date("2021-01-01T00:00:59"))).toBe(true);

    expect(shouldRunTask(task, new Date("2021-01-01T00:01:00"))).toBe(false);
  });

  test("#daily runs at midnight UTC", () => {
    const task = new Task(vi.fn()).daily();

    expect(shouldRunTask(task, new Date("2021-01-01T00:00:00"))).toBe(true);

    expect(shouldRunTask(task, new Date("2021-01-01T01:00:00"))).toBe(false);

    expect(shouldRunTask(task, new Date("2021-01-01T00:01:00"))).toBe(false);
  });

  test("#daily runs at specified time UTC", () => {
    const task = new Task(vi.fn()).dailyAt("13:23");

    expect(shouldRunTask(task, new Date("2021-01-01T13:23:00"))).toBe(true);
    expect(shouldRunTask(task, new Date("2021-01-01T00:00:00"))).toBe(false);
  });

  test("#weekly runs at Sunday midnight UTC", () => {
    const task = new Task(vi.fn()).weekly();

    expect(shouldRunTask(task, new Date("2021-01-03T00:00:00"))).toBe(true);
    expect(shouldRunTask(task, new Date("2021-01-04T00:00:00"))).toBe(false);
  });

  test("#weeklyOn runs at specified day and time UTC", () => {
    const task = new Task(vi.fn()).weeklyOn("1", "13:23");

    expect(shouldRunTask(task, new Date("2021-01-04T13:23:00"))).toBe(true);
    expect(shouldRunTask(task, new Date("2021-01-03T13:23:00"))).toBe(false);
    expect(shouldRunTask(task, new Date("2021-01-04T00:00:00"))).toBe(false);
  });

  test("#monthly runs on the first day of the month at midnight UTC", () => {
    const task = new Task(vi.fn()).monthly();

    expect(shouldRunTask(task, new Date("2021-01-01T00:00:00"))).toBe(true);
    expect(shouldRunTask(task, new Date("2021-02-01T00:00:00"))).toBe(true);
    expect(shouldRunTask(task, new Date("2021-01-02T00:00:00"))).toBe(false);
    expect(shouldRunTask(task, new Date("2021-02-01T01:00:00"))).toBe(false);
    expect(shouldRunTask(task, new Date("2021-02-01T00:01:00"))).toBe(false);
  });

  test("#monthlyOn runs on specified date of the month at the specified time UTC", () => {
    const task = new Task(vi.fn()).monthlyOn("1", "13:23");

    expect(shouldRunTask(task, new Date("2021-01-01T13:23:00"))).toBe(true);
    expect(shouldRunTask(task, new Date("2021-02-01T13:23:00"))).toBe(true);
    expect(shouldRunTask(task, new Date("2021-01-01T00:00:00"))).toBe(false);
    expect(shouldRunTask(task, new Date("2021-02-01T01:00:00"))).toBe(false);
    expect(shouldRunTask(task, new Date("2021-02-01T00:01:00"))).toBe(false);
  });

  test("#yearly runs on Jan 1 at Midnight UTC", () => {
    const task = new Task(vi.fn()).yearly();

    expect(shouldRunTask(task, new Date("2021-01-01T00:00:00"))).toBe(true);
    expect(shouldRunTask(task, new Date("2021-01-02T00:00:00"))).toBe(false);
    expect(shouldRunTask(task, new Date("2021-01-01T01:00:00"))).toBe(false);
    expect(shouldRunTask(task, new Date("2021-01-01T00:01:00"))).toBe(false);
  });
});
