
import {
  peek,
  pop,
  push,
  ReactSchedulerTask,
} from './scheduler-min-heap';

import { Priority } from './priority';
import { Type } from '@angular/core';
import { NOOP_ZONE_FLAGS, NZ_GLOBALS, NZ_ON_DONE, NZ_ON_STABLE, NZ_ON_START, NZ_ON_UNSTABLE, NzFlags, NzGlobals, NzGlobalsRef } from '../globals/globals';

interface Zone {
  run<T>(callback: Function, applyThis?: any, applyArgs?: any[], source?: string): T;
}

interface ZoneType {
  current: Zone;
  root: Zone;
}

/**
 * @description Will be provided through Terser global definitions by Angular CLI
 * during the production build.
 */
declare const ngDevMode: boolean;
declare const __noop_zone_globals__: NzGlobalsRef;
declare const Zone: ZoneType | undefined;
declare const setImmediate: (cb: () => any) => number;
declare const clearImmediate: (arg: any) => void

const nzGlobals = __noop_zone_globals__[NZ_GLOBALS];
const noopFn: Function = () => {};

let getCurrentTime: () => number;
const hasPerformanceNow =
  typeof performance === 'object' &&
  typeof performance.now === 'function';

if (hasPerformanceNow) {
  const localPerformance = performance;
  getCurrentTime = () => localPerformance.now();
} else {
  const localDate = Date;
  const initialTime = localDate.now();
  getCurrentTime = () => localDate.now() - initialTime;
}

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
const maxSigned31BitInt = 1073741823;

// Times out immediately
const IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
const USER_BLOCKING_PRIORITY_TIMEOUT = 250;
const NORMAL_PRIORITY_TIMEOUT = 5000;
const LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

// Tasks are stored on a min heap
const taskQueue: ReactSchedulerTask[] = [];
// const timerQueue: ReactSchedulerTask[] = [];
// Incrementing id counter. Used to maintain insertion order.
let taskIdCounter = 1;

let currentTask: ReactSchedulerTask | null = null;
let currentPriorityLevel = Priority.normal;

// This is set while performing work, to prevent re-entrancy.
let isPerformingWork = false;

let isHostCallbackScheduled = false;
let isHostTimeoutScheduled = false;
let started = false;


let onStart = noopFn;
let onDone = noopFn;
let onUnstable = noopFn;
let onStable = noopFn;
let scheduleMicrotask = noopFn;
let pendingTaskCallbacksCount = 0;
let schedulerInitCount = 0;
// let started = false;

function riseOnDoneIfQueueEmpty() {
  if (pendingTaskCallbacksCount) { return; }
  onDone();
  if (taskQueue.length) { return; }
  onStable();
  if (pendingTaskCallbacksCount) {
    throw new Error('Scheduling tasks in OnStabke() hook is forbidden!');
  }
}


function getTaskQueue(): ReactSchedulerTask[] {
  return taskQueue;
}

function flushWork(hasTimeRemaining: boolean, initialTime: number) {
  // We'll need a host callback the next time work is scheduled.
  isHostCallbackScheduled = false;
  if (isHostTimeoutScheduled) {
    // We scheduled a timeout but it's no longer needed. Cancel it.
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }

  isPerformingWork = true;
  const previousPriorityLevel = currentPriorityLevel;
  try {
    if (taskQueue.length > 0 && typeof peek(taskQueue)!.callback === 'function') {
      started = true;
      onStart();
    }
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}

function workLoop(
  hasTimeRemaining: boolean,
  initialTime: number,
  _currentTask: ReactSchedulerTask | null = null
): boolean {
  let currentTime = initialTime;
  if (_currentTask) {
    currentTask = _currentTask;
  } else {
    currentTask = peek(taskQueue);
  }

  const hitDeadline = () =>
    currentTask &&
    currentTask.expirationTime > currentTime &&
    (!hasTimeRemaining || shouldYieldToHost());

  if (!hitDeadline()) {
      while (currentTask !== null) {
        if (hitDeadline()) {
          break;
        }
        const callback = currentTask.callback;
        if (typeof callback === 'function') {
          currentTask.callback = null;
          currentPriorityLevel = currentTask.priorityLevel;
          // const didUserCallbackTimeout =
          //   currentTask.expirationTime <= currentTime;
          // const continuationCallback = callback(didUserCallbackTimeout);
          pendingTaskCallbacksCount--
          callback();
          currentTime = getCurrentTime();
          // if (typeof continuationCallback === 'function') {
          //   currentTask.callback = continuationCallback;
          // } else {
          if (currentTask === peek(taskQueue)) {
            pop(taskQueue);
          }
          // }
        } else {
          pop(taskQueue);
        }
        currentTask = peek(taskQueue);
      }
  }
  // we need to check if leaving `NgZone` (tick => detectChanges) caused other
  // directives to add tasks to the queue. If there is one and we still didn't
  // hit the deadline, run the workLoop again in order to flush everything thats
  // left.
  // Otherwise, newly added tasks won't run as `performingWork` is still `true`
  currentTask = currentTask ?? peek(taskQueue);
  // We should also re-calculate the currentTime, as we need to account for the execution
  // time of the NgZone tasks as well.
  // If there is still a task in the queue, but no time is left for executing it,
  // the scheduler will re-schedule the next tick anyway
  currentTime = getCurrentTime();

  if (currentTask && !hitDeadline()) {
    return workLoop(hasTimeRemaining, currentTime, currentTask);
  }
  // Return whether there's additional work
  if (currentTask !== null) {
    return true;
  } else {
    // const firstTimer = peek(timerQueue);
    // if (firstTimer !== null) {
    //   requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    // }
    return false;
  }
}

function scheduleCallback(
  priorityLevel: Priority,
  callback: VoidFunction,
): ReactSchedulerTask {
  const currentTime = getCurrentTime();

  let  startTime = currentTime;

  let timeout: number;
  switch (priorityLevel) {
    case Priority.immediate:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case Priority.userBlocking:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case Priority.idle:
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case Priority.low:
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case Priority.normal:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }

  const expirationTime = startTime + timeout;

  const newTask: ReactSchedulerTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };


  newTask.sortIndex = expirationTime;
  pendingTaskCallbacksCount++
  push(taskQueue, newTask);
  // Schedule a host callback, if needed. If we're already performing work,
  // wait until the next time we yield.
  if (!isHostCallbackScheduled && !isPerformingWork) {
    isHostCallbackScheduled = true;
    requestHostCallback(flushWork);
  }

  if (pendingTaskCallbacksCount === 1) {
    scheduleMicrotask(() => {
      if (pendingTaskCallbacksCount) {
        onUnstable();
      }
    })
  }


  return newTask;
}

function cancelCallback(task: ReactSchedulerTask) {
  // Null out the callback to indicate the task has been canceled. (Can't
  // remove from the queue because you can't remove arbitrary nodes from an
  // array based heap, only the first one.)


  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    if (
      typeof task.id !== 'number' &&
      typeof task.expirationTime !== 'number' &&
      typeof task.priorityLevel !== 'number' &&
      typeof task.sortIndex !== 'number' &&
      typeof task.expirationTime !== 'number' &&
      !(task.callback === null || typeof task.callback === 'function')
    ) {
      throw new Error('Invalid task token!')
    }
  }


  if (task.callback != null) {
    pendingTaskCallbacksCount--
    task.callback = null;
  }
}


let isMessageLoopRunning = false;
let scheduledHostCallback: Function | null = null;
let taskTimeoutID = -1;

// Scheduler periodically yields in case there is other work on the main
// thread, like user events. By default, it yields multiple times per frame.
// It does not attempt to align with frame boundaries, since most tasks don't
// need to be frame aligned; for those that do, use requestAnimationFrame.
let yieldInterval = 16;

// TODO: Make this configurable
// TODO: Adjust this based on priority?
let needsPaint = false;
let queueStartTime = -1;

function shouldYieldToHost() {
  if (needsPaint) {
    // There's a pending paint (signaled by `requestPaint`). Yield now.
    return true;
  }
  const timeElapsed = getCurrentTime() - queueStartTime;
  if (timeElapsed < yieldInterval) {
    // The main thread has only been blocked for a really short amount of time;
    // smaller than a single frame. Don't yield yet.
    return false;
  }

  // The main thread has been blocked for a non-negligible amount of time. We
  // may want to yield control of the main thread, so the browser can perform
  // high priority tasks. The main ones are painting and user input. If there's
  // a pending paint or a pending input, then we should yield. But if there's
  // neither, then we can yield less often while remaining responsive. We'll
  // eventually yield regardless, since there could be a pending paint that
  // wasn't accompanied by a call to `requestPaint`, or other main thread tasks
  // like network events.

  return true;
}

function forceFrameRate(fps: number) {
  if (fps < 0 || fps > 125) {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      console.error(
        'forceFrameRate takes a positive int between 0 and 125, ' +
          'forcing frame rates higher than 125 fps is not supported'
      );
    }
    return;
  }
  if (fps > 0) {
    yieldInterval = Math.floor(1000 / fps);
  } else {
    // reset the framerate
    yieldInterval = 5;
  }
  // be aware of browser housekeeping work (~6ms per frame)
  // according to https://developers.google.com/web/fundamentals/performance/rendering
  yieldInterval = Math.max(5, yieldInterval - 6);
}

const performWorkUntilDeadline = () => {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    // Yield after `yieldInterval` ms, regardless of where we are in the vsync
    // cycle. This means there's always time remaining at the beginning of
    // the message event.
    queueStartTime = currentTime;
    const hasTimeRemaining = true;

    // If a scheduler task throws, exit the current browser task so the
    // error can be observed.
    //
    // Intentionally not using a try-catch, since that makes some debugging
    // techniques harder. Instead, if `scheduledHostCallback` errors, then
    // `hasMoreWork` will remain true, and we'll continue the work loop.
    let hasMoreWork = true;
    try {
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        // If there's more work, schedule the next message event at the end
        // of the preceding one.
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
        scheduledHostCallback = null;

        scheduleMicrotask(riseOnDoneIfQueueEmpty);
      }
    }
  } else {
    isMessageLoopRunning = false;
    scheduleMicrotask(riseOnDoneIfQueueEmpty);
  }
  // Yielding to the browser will give it a chance to paint, so we can
  // reset this.
  needsPaint = false;
};

let schedulePerformWorkUntilDeadline = noopFn;
let disposeScheduledWork = noopFn;

function requestHostCallback(callback: (hasTimeRemaining: boolean, initialTime: number) => void) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

function cancelHostTimeout(): void {
  clearTimeout(taskTimeoutID);
  taskTimeoutID = -1;
}

function initializeScheduler(): void {
  schedulerInitCount++;
  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchedulerInitilized) { return; }

  if (typeof queueMicrotask === 'function') {
    scheduleMicrotask = queueMicrotask;
  } else {
    scheduleMicrotask = (fn: () => void) => {
      Promise.resolve().then(fn);
    }
  }

  if (typeof setImmediate === 'function') {
    // Node.js and old IE.
    // There's a few reasons for why we prefer setImmediate.
    //
    // Unlike MessageChannel, it doesn't prevent a Node.js process from exiting.
    // (Even though this is a DOM fork of the Scheduler, you could get here
    // with a mix of Node.js 15+, which has a MessageChannel, and jsdom.)
    // https://github.com/facebook/react/issues/20756
    //
    // But also, it runs earlier which is the semantic we want.
    // If other browsers ever implement it, it's better to use it.
    // Although both of these would be inferior to native scheduling.
    let timeoutId: number | undefined;
    schedulePerformWorkUntilDeadline = () => {
      timeoutId = setImmediate(performWorkUntilDeadline);
    };

    disposeScheduledWork = () => {
      if (typeof timeoutId !== 'undefined') {
        clearImmediate(timeoutId);
        timeoutId = undefined;
      }
    }
  } else if (typeof MessageChannel !== 'undefined') {
    const channel = new MessageChannel();
    const port = channel.port2;

    channel.port1.onmessage = performWorkUntilDeadline;
    schedulePerformWorkUntilDeadline = () => {
      port.postMessage(null);
    };

    disposeScheduledWork = () => {
      channel.port1.onmessage = null;
      channel.port1.close();
      channel.port2.close();
    }
  } else {
    // We should only fallback here in non-browser environments.
    let timeoutId: any;
    schedulePerformWorkUntilDeadline = () => {
      timeoutId = setTimeout(performWorkUntilDeadline, 0);
    };

    disposeScheduledWork = () => {
      if (typeof timeoutId !== 'undefined') {
        clearImmediate(timeoutId);
        timeoutId = undefined;
      }
    }
  }

  onStart = () => nzGlobals[NZ_ON_START].next();
  onDone = () => nzGlobals[NZ_ON_DONE].next();
  onStable = () => {
    nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.SchdulerStable;
    nzGlobals[NZ_ON_STABLE].next();
  };
  onUnstable = () => {
    if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerStable) {
      nzGlobals[NOOP_ZONE_FLAGS] ^= NzFlags.SchdulerStable;
      nzGlobals[NZ_ON_UNSTABLE].next();
    }
  }

  nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.SchedulerInitilized;
}

function initializeSchedulerForTesting(): void {
  scheduleMicrotask = (fn: () => void) => {
    const zone = Zone && Zone.current;

    if (typeof queueMicrotask === 'function') {
      if (zone) {
        zone.run(() => queueMicrotask(fn));
      } else {
        queueMicrotask(fn);
      }
    } else {
      if (zone) {
        zone.run(() => Promise.resolve().then(fn));
      } else {
        Promise.resolve().then();
      }
    }
  }

  schedulePerformWorkUntilDeadline = () => {
    const zone = Zone && Zone.current;
    let timeoutId: any;
    if (typeof setImmediate === 'function') {
      if (zone) {
        zone.run(() => setImmediate(() => {
          performWorkUntilDeadline();
        }));
      } else {
        setImmediate(() => {
          performWorkUntilDeadline()
        });
      }

      disposeScheduledWork = () => {
        if (typeof timeoutId === 'undefined') { return; }
        if (zone) {
          zone.run(() => clearImmediate(timeoutId));
        } else {
          clearImmediate(timeoutId);
        }
        timeoutId = undefined;
      }
    } else {
      if (zone) {
        zone.run(() => setTimeout(() => {
          performWorkUntilDeadline()
        }, 0));
      } else {
        setTimeout(() => {
          performWorkUntilDeadline();
        }, 0);
      }

      disposeScheduledWork = () => {
        if (typeof timeoutId === 'undefined') { return; }
        if (zone) {
          zone.run(() => clearTimeout(timeoutId));
        } else {
          clearTimeout(timeoutId);
        }
        timeoutId = undefined;
      }
    }
  }

  onStart = () => nzGlobals[NZ_ON_START].next();
  onDone = () => nzGlobals[NZ_ON_DONE].next();
  onStable = () => {
    nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.SchdulerStable;
    nzGlobals[NZ_ON_STABLE].next();
  };
  onUnstable = () => {
    if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerStable) {
      nzGlobals[NOOP_ZONE_FLAGS] ^= NzFlags.SchdulerStable;
      nzGlobals[NZ_ON_UNSTABLE].next();
    }
  }

  nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.SchedulerInitilized;
}

function deinitializeScheduler(): void {
  schedulerInitCount--

  if (schedulerInitCount > 0) {
    return;
  }

  disposeScheduledWork();

  disposeScheduledWork = noopFn;
  schedulePerformWorkUntilDeadline = noopFn;
  scheduleMicrotask = noopFn;
  onStart = noopFn;
  onDone = noopFn;
  onStable = noopFn;
  onUnstable = noopFn;
  taskIdCounter = 1;
  isPerformingWork = false;
  isHostCallbackScheduled = false;
  isHostTimeoutScheduled = false;
  currentTask = null;
  pendingTaskCallbacksCount = 0;

  let task = pop(taskQueue);
  while(task) { task = pop(taskQueue); }

  nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.SchdulerStable;
  nzGlobals[NOOP_ZONE_FLAGS] ^= NzFlags.SchedulerInitilized;

}

export {
  scheduleCallback,
  cancelCallback,
  getTaskQueue,
  forceFrameRate as forceFrameRate,
  initializeScheduler,
  initializeSchedulerForTesting,
  deinitializeScheduler
};
