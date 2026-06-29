const css = (name) =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

export const T = {
  // Existing names used throughout your project
  get bg() { return css("--bg-body"); },
  get bg2() { return css("--bg-body"); },
  get bg3() { return css("--bg-body"); },

  get surf() { return css("--bg-card"); },
  get surf2() { return css("--bg-card"); },

  get brd() { return css("--border"); },
  get brd2() { return css("--border"); },

  get pri() { return css("--primary"); },

  get tx() { return css("--text-primary"); },
  get tx2() { return css("--text-secondary"); },
  get tx3() { return css("--text-secondary"); },

  // Fixed colors
  ok: "#10b981",
  warn: "#f59e0b",
  err: "#ef4444",
  acc: "#06b6d4",
  acc2: "#8b5cf6",
};