import { type DefineConfigReturn } from "./config";

export async function handleScheduled<Env>(
  event: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
  config: DefineConfigReturn<Env>,
  scheduleDefinition: (scheduler: Scheduler) => void | Promise<void>
) {
  /**
   * Set the user config into the singleton context.
   * TODO: Replace this with AsyncLocalStorage when available.
   */
  config({ env, ctx });

  const now = new Date(event.scheduledTime);
  const scheduler = new Scheduler();

  await scheduleDefinition(scheduler);

  scheduler.tasks.forEach((task) => {
    if (shouldRunTask(task, now)) {
      ctx.waitUntil(task.fn());
    }
  });
}

class Scheduler {
  tasks: any[] = [];

  run(fn: () => Promise<any> | any): Task {
    const task = new Task(fn);
    this.tasks.push(task);

    return task;
  }

  job(job: any): Task {
    const task = new Task(async () => await job.handle());
    this.tasks.push(task);

    return task;
  }
}

/**
 * Constraints for when a task should run.
 */
const where = {
  minute: (minute: number) => (date: Date) => date.getMinutes() === minute,
  hour: (hour: number) => (date: Date) => date.getHours() === hour,
  day: (day: number) => (date: Date) => date.getDay() === day,
  date: (monthDate: number) => (date: Date) => date.getDate() === monthDate,
  month: (month: number) => (date: Date) => date.getMonth() === month,
};

export class Task {
  constructor(public fn: any, public constraints: any[] = []) {}

  /**
   * Run every minute.
   */
  everyMinute(): this {
    return this;
  }

  /**
   * Run hourly at the top.
   */
  hourly(): this {
    this.constraints.push(where.minute(0));

    return this;
  }

  /**
   * Run daily at midnight UTC.
   */
  daily(): this {
    this.constraints.push(where.minute(0));
    this.constraints.push(where.hour(0));

    return this;
  }

  /**
   * Run daily at a specific time UTC.
   */
  dailyAt(time: string): this {
    const [hour, minute] = time.split(":");
    this.constraints.push(where.minute(parseInt(minute, 10)));
    this.constraints.push(where.hour(parseInt(hour, 10)));

    return this;
  }

  /**
   * Run weekly on Sunday at midnight UTC.
   */
  weekly(): this {
    this.constraints.push(where.day(0));
    this.constraints.push(where.hour(0));
    this.constraints.push(where.minute(0));

    return this;
  }

  /**
   * Run weekly on a specific day of the week at a specific time UTC.
   */
  weeklyOn(day: string, time: string): this {
    const [hour, minute] = time.split(":");
    this.constraints.push(where.day(parseInt(day, 10)));
    this.constraints.push(where.minute(parseInt(minute, 10)));
    this.constraints.push(where.hour(parseInt(hour, 10)));

    return this;
  }

  /**
   * Run monthly on the first day of the month at midnight UTC.
   */
  monthly(): this {
    this.constraints.push(where.date(1));
    this.constraints.push(where.hour(0));
    this.constraints.push(where.minute(0));

    return this;
  }

  /**
   * Run monthly on a specific date of the month at a specific time UTC.
   */
  monthlyOn(date: string, time: string): this {
    const [hour, minute] = time.split(":");
    this.constraints.push(where.date(parseInt(date, 10)));
    this.constraints.push(where.minute(parseInt(minute, 10)));
    this.constraints.push(where.hour(parseInt(hour, 10)));

    return this;
  }

  yearly(): this {
    // Months are 0-based, LOL
    this.constraints.push(where.month(0));
    this.constraints.push(where.date(1));
    this.constraints.push(where.hour(0));
    this.constraints.push(where.minute(0));

    return this;
  }
}

export function shouldRunTask(task: Task, date: Date): boolean {
  if (task.constraints) {
    return task.constraints.every((constraint: any) => constraint(date));
  }

  return true;
}
