import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const proxy = {
  // Keep the team's public event contract intact; other routes use the local adapter.
  "^/api/events(?:\\?.*)?$": {
    target: process.env.PARRE_EVENTS_API_URL || "http://127.0.0.1:3000",
    changeOrigin: true,
  },
  "/api": {
    target: `http://127.0.0.1:${process.env.PARRE_API_PORT || 4174}`,
    changeOrigin: false,
  },
};
export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
