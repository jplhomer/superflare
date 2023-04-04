import { AsyncLocalStorage } from "node:async_hooks";
import { sanitizeModuleName } from "./string";

/**
 * A registry of models, jobs, and events. This is not bound to a request, as
 * classes will register themselves as soon as they're imported into the module graph.
 *
 * Do not store anything on this object that is request-specific because it will
 * be shared between requests. Use AppContext instead for request-specific data.
 */
export class Registry {
  static als?: AsyncLocalStorage<any>;

  static models?: {
    [name: string]: any;
  };

  static jobs?: {
    [name: string]: any;
  };

  static events?: {
    [name: string]: any;
  };
}

/**
 * Register a model into the Registry.
 */
export function registerModel(model: any) {
  Registry.models = Registry.models || {};
  Registry.models[model.name] = model;
}

/**
 * Get a model from the Registry.
 */
export function getModel(name: string) {
  return Registry.models?.[name];
}

/**
 * Register a job into the Registry.
 */
export function registerJob(job: any) {
  const jobName = sanitizeModuleName(job.name);
  Registry.jobs = Registry.jobs || {};
  Registry.jobs[jobName] = job;
}

/**
 * Get a Job from the Registry.
 */
export function getJob(name: string) {
  return Registry.jobs?.[name];
}

/**
 * Register an event into the Registry.
 */
export function registerEvent(event: any) {
  const eventName = sanitizeModuleName(event.name);
  Registry.events = Registry.events || {};
  Registry.events[eventName] = event;
}

export function getEvent(name: string) {
  return Registry.events?.[name];
}
