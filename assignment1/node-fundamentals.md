# Node.js Fundamentals

## What is Node.js?
Node.js is a program that allows developers to write JavaScript code outside of a web browser.

## How does Node.js differ from running JavaScript in the browser?
Since Node.js can run JavaScript outside the browser, it can also read and write files, start
a web server, and work with operating system services.

## What is the V8 engine, and how does Node use it?
V8 engine is the program that reads JavaScript and turns it into fast instructions the 
computer can run. Node uses the V8 engine to run JavaScript.

## What are some key use cases for Node.js?
Some key use cases for Node.js is Web APIs and servers, Command-line tools, and
Real-time apps.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.
The difference between CommonJS and ES Modules is that they use different syntax and
are designed for different environments.

**CommonJS (default in Node.js):**
```js
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

module.exports = { add, multiply };
```

**ES Modules (supported in modern Node.js):**
```js
export function add(a, b) {
    return a + b;
}
``` 