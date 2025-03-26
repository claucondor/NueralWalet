// Polyfills for Web3Auth and other libraries that require Node.js specific modules

// Global object for browser environment
window.global = window;

// Buffer polyfill
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Process polyfill
import process from 'process';
window.process = process;

// Otras variables globales que podrían ser necesarias
window.exports = {};
window.module = {
  exports: {}
}; 