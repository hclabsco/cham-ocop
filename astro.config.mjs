import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Static site served as Worker assets (wrangler.jsonc). No adapter, no server code.
export default defineConfig({
  site: "https://ocop.hclabs.co",
  trailingSlash: "always",
  build: { format: "directory" },
  vite: { plugins: [tailwindcss()] },
  // Self-hosted at build time: no request to Google from the visitor's browser.
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Plus Jakarta Sans",
      cssVariable: "--font-sans",
      weights: [400, 500, 700],
      styles: ["normal"],
      subsets: ["latin", "vietnamese"],
      fallbacks: ["system-ui", "sans-serif"],
      display: "swap",
    },
  ],
});
