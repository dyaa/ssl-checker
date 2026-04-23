import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { writeFileSync } from "fs";

export default defineConfig([
  {
    input: "src/index.ts",
    output: [
      { file: "lib/es/index.mjs", format: "module" },
      { file: "lib/cjs/index.js", format: "commonjs" },
    ],
    external: ["https", "tls", "net"],
    watch: {
      include: "src/**",
    },
    plugins: [
      typescript(),
      {
        name: "esm-package-json",
        writeBundle(options) {
          if (options.format === "es") {
            writeFileSync(
              "lib/es/package.json",
              '{\n  "type": "module"\n}\n',
            );
          }
        },
      },
    ],
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
