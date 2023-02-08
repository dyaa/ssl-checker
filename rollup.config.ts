import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";

export default defineConfig({
  input: "src/index.ts",
  output: [
    { file: "lib/es/index.js", format: "module" },
    { file: "lib/cjs/index.js", format: "commonjs" },
  ],
  external: ["https"],
  watch: {
    include: "src/**",
  },
  plugins: [typescript()],
});
