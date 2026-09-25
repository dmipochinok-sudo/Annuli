// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Public Lovable Cloud connection values. Keeping these fallbacks here makes
// published builds resilient when the hosting build omits injected VITE_* vars.
process.env["VITE_SUPABASE_URL"] ??= "https://vxrkpcwywtfbhaqivmyd.supabase.co";
process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??=
  "sb_publishable_ssT8Iv5xGyOrieBajPO36w_76_QpGHt";

export default defineConfig({
  vite: {
    // Ensure the server-function base path is inlined in browser dev modules
    // (otherwise TanStack's client RPC reads `process.env` in the browser).
    define: {
      "process.env.TSS_SERVER_FN_BASE": JSON.stringify("/_serverFn/"),
    },
    plugins: [
      {
        // `define` is not applied to un-bundled node_modules in dev, so patch
        // TanStack's client RPC module directly for the browser.
        name: "annuli-inline-server-fn-base",
        enforce: "pre",
        transform(code, id, opts) {
          if (opts?.ssr) return null;
          if (!id.includes("start-client-core") || !code.includes("process.env.TSS_SERVER_FN_BASE")) return null;
          return code.replaceAll("process.env.TSS_SERVER_FN_BASE", JSON.stringify("/_serverFn/"));
        },
      },
    ],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
