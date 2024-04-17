export enum Priority {
  // noop,
  immediate = 1,
  userBlocking = 2,
  normal = 3,
  low = 4,
  idle = 5,
}

export function coercePriority(priority: number): Priority {
  return Math.round(priority < 1 ? 1 : priority > 5 ? 5 : priority);
}
