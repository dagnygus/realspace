// import { ɵglobal } from '@angular/core';
// import { enableIsInputPending } from './schedulerFeatureFlags';
import {
  peek,
  pop,
  push,
  ReactSchedulerTask,
} from './scheduler-min-heap';

import { Priority } from './priority';
import { Type } from '@angular/core';

/**
 * @description Will be provided through Terser global definitions by Angular CLI
 * during the production build.
 */
declare const ngDevMode: boolean;
declare const process: any
declare const global: any

const isNodeJS = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node != null;

function getGlobalThis(): any  {

  if (typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node != null) {
    return global || globalThis;
  }

  if (typeof window === 'object' && typeof document === 'object') {
    return window;
  }

  throw new Error('Unknown JS runtime!');
}

const runtimeThis = getGlobalThis();

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

// Pausing the scheduler is useful for debugging.
let isSchedulerPaused = false;

let currentTask: ReactSchedulerTask | null = null;
let currentPriorityLevel = Priority.normal;

// This is set while performing work, to prevent re-entrancy.
let isPerformingWork = false;

let isHostCallbackScheduled = false;
let isHostTimeoutScheduled = false;

// Capture local references to native APIs, in case a polyfill overrides them.

// Potential Hooks;
let onStartCallback: () => void = null!;
let onDoneCallback: () => void = null!;
let onStableCallback: () => void = null!;

const setTimeout = runtimeThis.setTimeout as (cb: () => any, milis: number) => number;
const clearTimeout = runtimeThis.clearTimeout as (id: number) => undefined | void;
const setImmediate = runtimeThis.setImmediate as (cb: () => any) => number;
const LocalMessageChannel = runtimeThis.MessageChannel as Type<MessageChannel>;

const queueMicrotask: (cb: () => void) => void =
  typeof runtimeThis.queueMicrotask === 'function' ?
  runtimeThis.queueMicrotask.bind(runtimeThis) :
  (cb: () => void) => Promise.resolve().then(cb)

const riseDoneCallback = () => {
  onDoneCallback();
  if (taskQueue.length === 0) {
    onStableCallback();
  }
}

const isInputPending =
  isNodeJS ? null :
  runtimeThis.navigator !== 'undefined' &&
  runtimeThis.navigator.scheduling !== undefined &&
  runtimeThis.navigator.scheduling.isInputPending !== undefined ?
  runtimeThis.navigator.scheduling.isInputPending.bind(runtimeThis.navigator.scheduling) : null;


function isWorkLoopRunning(): boolean {
  return isPerformingWork;
}

function getTaskQueue(): ReactSchedulerTask[] {
  return taskQueue;
}

function setOnStartCallback(callback: () => void) {
  onStartCallback = callback;
}

function setOnDoneCallback(callback: () => void) {
  onDoneCallback = callback;
}

function setOnStableCallback(callback: () => void) {
  onStableCallback = callback;
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
    if (taskQueue.length > 0) {
      onStartCallback();
    }
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    // onDoneCallback();
    isPerformingWork = false;
    // if (taskQueue.length === 0) {
    //   onStableCallback();
    // }
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
          const didUserCallbackTimeout =
            currentTask.expirationTime <= currentTime;
          const continuationCallback = callback(didUserCallbackTimeout);
          currentTime = getCurrentTime();
          if (typeof continuationCallback === 'function') {
            currentTask.callback = continuationCallback;
          } else {
            if (currentTask === peek(taskQueue)) {
              pop(taskQueue);
            }
          }
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

function runWithPriority(priorityLevel: Priority, eventHandler: () => any) {
  switch (priorityLevel) {
    case Priority.immediate:
    case Priority.userBlocking:
    case Priority.normal:
    case Priority.low:
    case Priority.idle:
      break;
    default:
      priorityLevel = Priority.normal;
  }

  const previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;

  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}

function next(eventHandler: () => any) {
  let priorityLevel;
  switch (currentPriorityLevel) {
    case Priority.immediate:
    case Priority.userBlocking:
    case Priority.normal:
      // Shift down to normal priority
      priorityLevel = Priority.normal;
      break;
    default:
      // Anything lower than normal priority should remain at the current level.
      priorityLevel = currentPriorityLevel;
      break;
  }

  const previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;

  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}

function wrapCallback(this: any, callback: VoidFunction) {
  const parentPriorityLevel = currentPriorityLevel;
  return () => {
    // This is a fork of runWithPriority, inlined for performance.
    const previousPriorityLevel = currentPriorityLevel;
    currentPriorityLevel = parentPriorityLevel;

    try {
      // eslint-disable-next-line prefer-rest-params
      return callback.apply(this as any, arguments as any);
    } finally {
      currentPriorityLevel = previousPriorityLevel;
    }
  };
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
    push(taskQueue, newTask);
    // Schedule a host callback, if needed. If we're already performing work,
    // wait until the next time we yield.
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }


  return newTask;
}



function pauseExecution() {
  isSchedulerPaused = true;
}

function continueExecution() {
  isSchedulerPaused = false;
  if (!isHostCallbackScheduled && !isPerformingWork) {
    isHostCallbackScheduled = true;
    requestHostCallback(flushWork);
  }
}

function getFirstCallbackNode() {
  return peek(taskQueue);
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


  task.callback = null;
}

function getCurrentPriorityLevel() {
  return currentPriorityLevel;
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
const maxYieldInterval = 300;
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

  // we don't support isInputPending currently
  /*if (enableIsInputPending) {
    if (needsPaint) {
      // There's a pending paint (signaled by `requestPaint`). Yield now.
      return true;
    }
    if (timeElapsed < continuousInputInterval) {
      // We haven't blocked the thread for that long. Only yield if there's a
      // pending discrete input (e.g. click). It's OK if there's pending
      // continuous input (e.g. mouseover).
      if (isInputPending !== null) {
        return isInputPending();
      }
    } else if (timeElapsed < maxInterval) {
      // Yield if there's either a pending discrete or continuous input.
      if (isInputPending !== null) {
        return isInputPending(continuousOptions);
      }
    } else {
      // We've blocked the thread for a long time. Even if there's no pending
      // input, there may be some other scheduled work that we don't know about,
      // like a network event. Yield now.
      return true;
    }
  }*/

  // `isInputPending` isn't available. Yield now.
  return true;
}

function requestPaint() {
  needsPaint = true;
  // we don't support isInputPending currently
  /*if (
    enableIsInputPending &&
    navigator !== undefined &&
    (navigator as any).scheduling !== undefined &&
    (navigator as any).scheduling.isInputPending !== undefined
  ) {
    needsPaint = true;
  }*/
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


        // onDoneCallback();
        // if (taskQueue.length === 0) {
        //   onStableCallback();
        // }

        // Promise.resolve().then(() => {
        //   onDoneCallback();
        //   if (taskQueue.length === 0) {
        //     onStableCallback();
        //   }
        // });

        queueMicrotask(riseDoneCallback);
      }
    }
  } else {
    isMessageLoopRunning = false;
    onDoneCallback();
    if (taskQueue.length === 0) {
      onStableCallback();
    }
  }
  // Yielding to the browser will give it a chance to paint, so we can
  // reset this.
  needsPaint = false;
};

let schedulePerformWorkUntilDeadline: () => void;

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
  schedulePerformWorkUntilDeadline = () => {
    setImmediate(performWorkUntilDeadline);
  };
} else if (!isNodeJS && typeof LocalMessageChannel !== 'undefined') {
  const channel = new LocalMessageChannel();
  const port = channel.port2;

  channel.port1.onmessage = performWorkUntilDeadline;
  schedulePerformWorkUntilDeadline = () => {
    port.postMessage(null);
  };
} else {
  // We should only fallback here in non-browser environments.
  schedulePerformWorkUntilDeadline = () => {
    setTimeout(performWorkUntilDeadline, 0);
  };
}

function requestHostCallback(callback: (hasTimeRemaining: boolean, initialTime: number) => void) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

// function requestHostTimeout(callback: (currentTime: number) => void, ms: number) {
//   taskTimeoutID = setTimeout(() => {
//     callback(getCurrentTime());
//   }, ms) as any;
// }

function cancelHostTimeout() {
  clearTimeout(taskTimeoutID);
  taskTimeoutID = -1;
}

const _requestPaint = requestPaint;

export {
  runWithPriority,
  next,
  scheduleCallback,
  cancelCallback,
  getTaskQueue,
  wrapCallback,
  getCurrentPriorityLevel,
  shouldYieldToHost as shouldYield,
  _requestPaint as requestPaint,
  continueExecution,
  pauseExecution,
  getFirstCallbackNode,
  getCurrentTime as now,
  forceFrameRate as forceFrameRate,
  isWorkLoopRunning,
  setOnStartCallback,
  setOnDoneCallback,
  setOnStableCallback,
};
