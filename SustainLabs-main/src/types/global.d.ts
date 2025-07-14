declare global {
  interface Window {
    global: Window & typeof globalThis;
    Buffer: any;
    process: any;
  }
}

export {}; 