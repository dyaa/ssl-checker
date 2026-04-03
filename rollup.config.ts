import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";

export default defineConfig([
  {
    input: "src/index.ts",
    output: [
      { file: "lib/es/index.js", format: "module" },
      { file: "lib/cjs/index.js", format: "commonjs" },
    ],
    external: ["https", "tls", "net"],
    watch: {
      include: "src/**",
    },
    plugins: [typescript()],
  },
  {
    input: "src/cli.ts",
    output: [
      {
        file: "lib/cjs/cli.js",
        format: "commonjs",
        banner: "#!/usr/bin/env node",
      },
    ],
    external: ["https", "tls", "net"],
    plugins: [typescript()],
  },
]);
