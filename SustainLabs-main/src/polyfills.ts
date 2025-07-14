import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
  window.global = window;
}

// Export Buffer for use in other files
export { Buffer }; 