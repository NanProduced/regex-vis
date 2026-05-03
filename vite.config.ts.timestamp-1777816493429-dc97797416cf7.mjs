// vite.config.ts
import path from "node:path";
import { defineConfig } from "file:///C:/Users/nanpr/solo-coder-project/regex-vis/node_modules/.pnpm/vite@5.3.3_@types+node@18.19.39/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/nanpr/solo-coder-project/regex-vis/node_modules/.pnpm/@vitejs+plugin-react-swc@3._62d5f1176eabb4a8a61b5c111d4ee900/node_modules/@vitejs/plugin-react-swc/index.mjs";
import tsconfigPaths from "file:///C:/Users/nanpr/solo-coder-project/regex-vis/node_modules/.pnpm/vite-tsconfig-paths@4.3.2_t_f28d5d202f1726761a70f539a6a0833d/node_modules/vite-tsconfig-paths/dist/index.mjs";
import { ViteEjsPlugin } from "file:///C:/Users/nanpr/solo-coder-project/regex-vis/node_modules/.pnpm/vite-plugin-ejs@1.7.0_vite@5.3.3_@types+node@18.19.39_/node_modules/vite-plugin-ejs/index.js";
var __vite_injected_original_dirname = "C:\\Users\\nanpr\\solo-coder-project\\regex-vis";
var vite_config_default = defineConfig({
  base: "/",
  plugins: [react(), tsconfigPaths(), ViteEjsPlugin()],
  define: {
    // eslint-disable-next-line node/prefer-global/process
    SENTRY_DSN: JSON.stringify(process.env.SENTRY_DSN)
  },
  resolve: {
    alias: {
      "tailwind.config": path.resolve(__vite_injected_original_dirname, "tailwind.config.ts")
    }
  },
  optimizeDeps: {
    include: [
      "tailwind.config.ts"
    ]
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxuYW5wclxcXFxzb2xvLWNvZGVyLXByb2plY3RcXFxccmVnZXgtdmlzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxuYW5wclxcXFxzb2xvLWNvZGVyLXByb2plY3RcXFxccmVnZXgtdmlzXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9uYW5wci9zb2xvLWNvZGVyLXByb2plY3QvcmVnZXgtdmlzL3ZpdGUuY29uZmlnLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxyXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnXHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnXHJcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gJ3ZpdGUtdHNjb25maWctcGF0aHMnXHJcbmltcG9ydCB7IFZpdGVFanNQbHVnaW4gfSBmcm9tICd2aXRlLXBsdWdpbi1lanMnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIGJhc2U6ICcvJyxcclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgdHNjb25maWdQYXRocygpLCBWaXRlRWpzUGx1Z2luKCldLFxyXG4gIGRlZmluZToge1xyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vZGUvcHJlZmVyLWdsb2JhbC9wcm9jZXNzXHJcbiAgICBTRU5UUllfRFNOOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5TRU5UUllfRFNOKSxcclxuICB9LFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgICd0YWlsd2luZC5jb25maWcnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAndGFpbHdpbmQuY29uZmlnLnRzJyksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXHJcbiAgICAgICd0YWlsd2luZC5jb25maWcudHMnLFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHRlc3Q6IHtcclxuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxyXG4gICAgZ2xvYmFsczogdHJ1ZSxcclxuICAgIHNldHVwRmlsZXM6ICcuL3Rlc3RzL3NldHVwLnRzJyxcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLG1CQUFtQjtBQUMxQixTQUFTLHFCQUFxQjtBQUw5QixJQUFNLG1DQUFtQztBQU96QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixTQUFTLENBQUMsTUFBTSxHQUFHLGNBQWMsR0FBRyxjQUFjLENBQUM7QUFBQSxFQUNuRCxRQUFRO0FBQUE7QUFBQSxJQUVOLFlBQVksS0FBSyxVQUFVLFFBQVEsSUFBSSxVQUFVO0FBQUEsRUFDbkQ7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLG1CQUFtQixLQUFLLFFBQVEsa0NBQVcsb0JBQW9CO0FBQUEsSUFDakU7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixhQUFhO0FBQUEsSUFDYixTQUFTO0FBQUEsSUFDVCxZQUFZO0FBQUEsRUFDZDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
