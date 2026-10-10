import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom lacks these browser APIs; the app uses them.
// Each stub just needs to exist so code doesn't crash — individual tests
// override or clear them as needed.

// URL.createObjectURL / revokeObjectURL — voice-note audio and PDF download
Object.defineProperty(URL, "createObjectURL", {
  value: vi.fn(() => "blob:mock"),
  configurable: true,
  writable: true,
});
Object.defineProperty(URL, "revokeObjectURL", {
  value: vi.fn(),
  configurable: true,
  writable: true,
});

// navigator.clipboard — copying the share link
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  configurable: true,
});

// navigator.mediaDevices.getUserMedia — starting a voice recording
Object.defineProperty(navigator, "mediaDevices", {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
  configurable: true,
});

// MediaRecorder — the class that actually records
class MockMediaRecorder {
  state = "inactive";
  ondataavailable: ((e: { data: { size: number } }) => void) | null = null;
  onstop: (() => void) | null = null;
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: { size: 1024 } });
    this.onstop?.();
  }
}
Object.defineProperty(globalThis, "MediaRecorder", {
  value: MockMediaRecorder,
  configurable: true,
  writable: true,
});

// matchMedia — framer-motion reads the reduced-motion preference
Object.defineProperty(window, "matchMedia", {
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
  configurable: true,
  writable: true,
});

afterEach(() => {
  cleanup();
});
