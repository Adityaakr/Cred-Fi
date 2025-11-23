/**
 * Polyfills for Node.js modules in browser
 * MUST be imported before any other code
 */

// Buffer polyfill
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Process polyfill
if (typeof global.process === 'undefined') {
  global.process = require('process/browser');
}

// Ensure process.env exists
if (!global.process.env) {
  global.process.env = {};
}

// Fix for _stream_writable error
if (typeof global.process.browser === 'undefined') {
  global.process.browser = true;
}

// Ensure process.nextTick exists
if (typeof global.process.nextTick === 'undefined') {
  global.process.nextTick = function(callback, ...args) {
    setTimeout(() => callback(...args), 0);
  };
}

console.log('✅ Polyfills loaded');
