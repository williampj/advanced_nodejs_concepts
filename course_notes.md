- [1. The Internals of Node](#1-the-internals-of-node)
  - [What does NodeJS give us?](#what-does-nodejs-give-us)
  - [Module Implementations](#module-implementations)
  - [Event Loop](#event-loop)
    - [JS is not strictly single-threaded](#js-is-not-strictly-single-threaded)
  - [libuv](#libuv)
    - [libuv Threadpool](#libuv-threadpool)
    - [OS's async features](#oss-async-features)
  - [NodeJS sequence of events (starting a file)](#nodejs-sequence-of-events-starting-a-file)
- [2. Enhancing Node Performance (cluster mode and worker threads)](#2-enhancing-node-performance-cluster-mode-and-worker-threads)

- NodeJS relies on two dependencies/modules

  - 1. **V8** is an open source JS engine written by google to execute JS code outside browser
  - 2. **libuv** - C++ open source project that gives node access to OS, file system, networking and aspects of concurrency

## 1. The Internals of Node

### What does NodeJS give us?

- NodeJS lets us write JavaScript code and just have it work, rather than requiring us to write in C++
  - its an interface for our JS code to the C++ on the computer
- NodeJS also provides a series of wrappers and unified, consistent API to use
  - eg: http, fs, path, crypto modules
  - They all ultimately refer to functionality living in the `libuv` library

### Module Implementations

- in **github.com/nodejs/node** repository
  - _lib_ folder contains JS definitions of functions/modules we require into our project
  - _src_ folder contains C++ implementations of the modules we're using

### Event Loop

Terminology:

- **Threads** are units of instruction that are waiting to be executed by the CPU
- **Scheduling** - deciding the order of executing threads
  - scheduling is done by the OS
- **tick** - one iteration of the event loop
- Two ways to improve the rate of threads

  - 1. add more CPU cores to the machine
  - 2. allow OS scheduler to detect big pauses in processing time due to expensive I/O operations

- The Event Loop is the control structure that decides what the one thread should be doing at any one point in time
  - It's the core of every NodeJS program

#### JS is not strictly single-threaded

- The event loop uses a single, main thread
- But NodeJS offloads many computationally intensive tasks to other threads (libuv's thread pool)

### libuv

#### libuv Threadpool

- We can write custom JS that uses the thread pool
- The threadpool is used by all _fs_ module functions, some crypto stuff. Also depends on OS (windows vs unix based)
- threadpool & event loop: Tasks running in the threadpool are the `pendingOperations` in our `loop.js` file

#### OS's async features

- libuv also has access to async helpers in the underlying OS
  - eg. can run countless network requests simultaneously (https module)
- OS async features are used by nearly every networking function (making/receiving requests, listening on a port), and some other OS specific functions (also dependent on specific OS)
  - so don't try to detect or plan for using this
- OS Async & event loop: Tasks using the underlying OS are the `pendingOSTasks` in our `loop.js` file

### NodeJS sequence of events (starting a file)

1. process and execute code in the file (including all files in `require` statements)
2. Enters the event loop:
   1. still work to do? (timers, OS tasks, threadpool), if no -> exit program
   2. Run callbacks for completed os/threadpool tasks (99 % of the code)
   3. pause and wait for stuff to happen
   4. run any `setImmediate` functions
   5. handle close events
      Repeat event loop

## 2. Enhancing Node Performance (cluster mode and worker threads)

- _Cluster mode_ is used to run multiple copies of Node that are all running our server inside them
  - we can't trick Node into running in multiple threads
  - but if we run multiple copies, then we get multiple instances of the event loop so it works somewhat similar to multi-threaded
  - NB: Recommended and battle-tested approach to improving app performance
- _Worker threads_ can do a lot of performance work in the app
  - worker threads use the libuv thread pool when we start the app
  - NB: Experimental still
- So look to cluster mode first, then check out worker threads
