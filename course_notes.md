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
  - [The reason to use cluster mode](#the-reason-to-use-cluster-mode)
  - [How clustering can mitigate the problem](#how-clustering-can-mitigate-the-problem)
  - [Cases where clustering is less of a benefit](#cases-where-clustering-is-less-of-a-benefit)
  - [Benchmarking - Apache HTTP server benchmarking tool](#benchmarking---apache-http-server-benchmarking-tool)
  - [PM2 - cluster management tool](#pm2---cluster-management-tool)
  - [Worker Threads](#worker-threads)
    - [webworker-threads npm tool](#webworker-threads-npm-tool)

## 1. The Internals of Node

- NodeJS relies on two dependencies/modules

  - 1. **V8** is an open source JS engine written by google to execute JS code outside browser
  - 2. **libuv** - C++ open source project that gives node access to OS, file system, networking and aspects of concurrency

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

- nb: index.js file implements the following

- _Cluster mode_ is used to run multiple copies of Node that are all running our server inside them
  - we can't trick Node into running in multiple threads
  - but if we run multiple copies, then we get multiple instances of the event loop so it works somewhat similar to multi-threaded
  - NB: Recommended and battle-tested approach to improving app performance
- _Worker threads_ can do a lot of performance work in the app
  - worker threads use the libuv thread pool when we start the app
  - NB: Experimental still
- So look to cluster mode first, then check out worker threads

- `nodemon` is a good tool that automatically restarts nodejs apps when a change has been made (rather than halting and restarting server with every change)
  - But, it works poorly with nodejs in cluster mode

### The reason to use cluster mode

- Request -> Node Server (single-thread) -> Response
  - This model works fine most of the time, but is problematic when a lot of expensive operations needs to be processed by the server
    - The processing of incoming requests won't be effectively processed
  - JavaScript code (eg. `while` loops) can hold up the server's thread to slow down requests and queue other requests
  - = effects of long-running or computationally expensive code can be catastrophic to a server
- Clustering will give more predictable response times to requests, rather than having slow requests hold up other requests

### How clustering can mitigate the problem

- One parent process called the _cluster manager_ is responsible for monitoring the health of the individual NodeJS processes/instances that are launched simultaneously
  - The cluster manager doesn't handle any code itself, only starts, stops, restarts and sends data to the NodeJS instances
- When node runs a file, it reads the contents of the file and creates a node instance
  - -> The first instance to be run will be referred to as the "cluster manager"
  - -> The cluster manager then starts up worker instances, which are actually responsible for processing incoming requests
    - To create worker instances, the _cluster_ module is used. The _cluster.fork()_ method is called whereby NodeJS executes the current file a second time which starts up the worker instance
      = i.e. index.js file will be executed multiple times by node (cluster manager first time, then worker instances each subsequent time)
  - For the cluster manager, `cluster.isMaster` is true, and false for all worker instances

### Cases where clustering is less of a benefit

- There is a point of diminishing returns when adding more NodeJS children
- If a cluster contains 6 child nodes that are processing at the same time on a dual core CPU (over-allocation of cluster instances)
  - -> the child nodes will be run concurrently leading to across-the-board very slow responses (low average)
  - = Overall performance suffers when the CPU is trying to task switch between more node instances (doing cpu-intensive work) than there are CPU cores
  - By lowering the cluster size, the first requests can be completed fast before moving on the next ones.
    - The final request might be done at the same time as if the cluster size was large, but at least many requests will have been completed at this time
- In general, _match the number of children to the number of physical or logical cores in the cpu_
  - Sometimes the OS interprets one physical process/core as two logical cores (in the case of multi-threading), but Grider suggests mapping to physical cores

### Benchmarking - Apache HTTP server benchmarking tool

- apache benchmarking comes with macbook and some linux distributions
- run `ab` on command line
  - `ab help` or `man ab` will give documentation
- `ab -c 50 -n 500 localhost:3000/fast`
  - apache benchmark to localhost:3000/fast, with a total of 500 requests and a concurrency of 50 (50 requests running at any given time, whenever one is return a new one is made)
- Relevant metrics to look for
  - `Requests per second` that the server processed
  - `Time per request` on average
  - Distribution of time at the bottom
    - 50 % served within a certain time period, and what the longest request is
- Every computer has an upper limit to the amounts of bits and data it can crunch

### PM2 - cluster management tool

- The best cluster management software for production is the open source **PM2-CLI**
  - It spawns new instances of the cluster and monitors the health of each
  - [pm2 docs](pm2.keymetrics.io)
  - [pm2 repo](https://github.com/Unitech/pm2)
- To run a program with pm2 from the terminal:
  `pm2 start index.js -i 0`
  - `-i 0` 0 means that pm2 will set up number of instances equal to number of logical CPU cores on the computer
  - **logical cores** = physical cores \* number of threads each core can process
- To print the health of each instance
  `pm2 list`

┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name │ mode │ ↺ │ status │ cpu │ memory │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0 │ index2 │ cluster │ 0 │ online │ 28% │ 35.9mb │
│ 1 │ index2 │ cluster │ 0 │ online │ 28% │ 36.7mb │
│ 2 │ index2 │ cluster │ 0 │ online │ 0% │ 33.4mb │
│ 3 │ index2 │ cluster │ 0 │ online │ 0% │ 32.2mb │
│ 4 │ index2 │ cluster │ 0 │ online │ 0% │ 26.9mb │
│ 5 │ index2 │ cluster │ 0 │ online │ 0% │ 25.0mb │
│ 6 │ index2 │ cluster │ 0 │ online │ 0% │ 23.5mb │
│ 7 │ index2 │ cluster │ 0 │ online │ 0% │ 20.6mb │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘

- to inspect a particular instance (gives detailed information)
  `pm2 show index2` (file name without .js extension)
- To get a cool, scrollable dashboard over the cluster instances with global logs
  `pm2 monit`
- If any children crashes, PM2 will restart it for us
- To stop the running instances
  `pm2 delete index2` (file name without .js extension)
- PM2 is typically used in production environments
  - PM2 also has many ways to gain access to remote servers
  - Not used much in development apart from starting the app and inspecting that it works

### Worker Threads

- NB: Worker Threads are still in the experimental stage
- Grider would not use both cluster mode and worker threads in the same application
  - Worker Threads uses the same thread pool managed by libuv for other functions
  - We're thus still limited by the overall processing power of the CPU

#### webworker-threads npm tool

- [webworker_threads npm package](https://www.npmjs.com/package/webworker-threads)
-
