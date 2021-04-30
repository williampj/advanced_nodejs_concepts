// This file emulates the event loop (to understand how it works)

// node myFile.js

const pendingTimers = [];
const pendingOSTasks = [];
const pendingOperations = [];

// New timers, tasks, operations are recorded from myFile running

myFile.runContents();

// These three checks emulates what NodeJS inspects in order to decide if the event loop should run for another pass

function shouldContinue() {
  // Check one: Any pending setTimeout, setInterval, setImmediate?
  // Check two: Any pending OS tasks? (eg. server listening to port)
  // Check three: Any pending long running operations in the thread pool? (eg fs module)?

  return (
    pendingTimers.length || pendingOSTasks.length || pendingOperations.length
  );
}

// Entire body executes in one 'tick'

while (shouldContinue()) {
  // The following 5 steps are executed during every execution of the event loop
  // Steps 1 & 2 is where Node does the bulk of its work
  //
  // Step 1) Node looks at pendingTimers (for setTimeout and setInterval) and sees if any callback functions are ready to be called
  //
  // Step 2) Node looks at pendingOSTasks and pendingOperations and calls relevant callbacks
  //
  // Step 3) Pause execution (if no step 1 or step 2 tasks). Continue when..
  // - a new pendingOSTask is done
  // - a new pendingOperation is done
  // - a timer (setTimeout or setInterval) is about to expire and the relevant function needs to be called
  //
  // Step 4) Node looks at pendingTimers (for setImmediate) and calls any setImmediate
  //
  // Step 5) Handle any 'close' events (eg. readStream.on('close', cb)) - execute the cleanup code callback
}

// exit back to terminal
