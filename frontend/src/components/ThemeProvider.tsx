"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

// Safeguard wrapper to prevent buggy Chrome extensions from crashing Next.js event loop
if (typeof window !== "undefined") {
  // Patch window.chrome to prevent buggy WebSocket monitor extensions from crashing
  try {
    const win = window as any;
    if (!win.chrome) win.chrome = {};
    if (!win.chrome.runtime) win.chrome.runtime = {};
    if (!win.chrome.runtime.sendMessage) win.chrome.runtime.sendMessage = () => {};
    if (!win.chrome.extension) win.chrome.extension = {};
    if (!win.chrome.extension.sendMessage) win.chrome.extension.sendMessage = () => {};
  } catch (e) {
    console.error("Failed to patch chrome.runtime:", e);
  }

  try {
    const originalSend = WebSocket.prototype.send;
    WebSocket.prototype.send = function(this: WebSocket, data: any) {
      try {
        return originalSend.call(this, data);
      } catch (err) {
        console.warn("⚠️ [KursAI/Safeguard] Intercepted WebSocket.send crash from browser extension:", err);
      }
    };
  } catch (e) {
    console.error("Failed to patch WebSocket:", e);
  }
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
