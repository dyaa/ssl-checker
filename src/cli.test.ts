import { expect, describe, it } from "vitest";
import { execFile } from "child_process";
import { resolve } from "path";

const CLI_PATH = resolve(__dirname, "../lib/cjs/cli.js");

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((res) => {
    execFile("node", [CLI_PATH, ...args], { timeout: 15000 }, (err, stdout, stderr) => {
      res({ stdout, stderr, code: err ? (err as any).code ?? 1 : 0 });
    });
  });
}

describe("CLI", () => {
  it("Should output certificate info for a valid host", async () => {
    const { stdout, code } = await runCli(["github.com"]);
    expect(code).toBe(0);
    expect(stdout).toContain("github.com");
    expect(stdout).toContain("Valid");
    expect(stdout).toContain("Issuer");
    expect(stdout).toContain("Protocol");
  });

  it("Should output valid JSON with --json flag", async () => {
    const { stdout, code } = await runCli(["github.com", "--json"]);
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.valid).toBe(true);
    expect(parsed.issuer).toBeDefined();
    expect(parsed.protocol).toBeDefined();
  });

  it("Should exit 1 for invalid host", async () => {
    const { code } = await runCli(["this.domain.does.not.exist.example"]);
    expect(code).not.toBe(0);
  });

  it("Should show help with --help", async () => {
    const { stdout } = await runCli(["--help"]);
    expect(stdout).toContain("Usage");
  });
});
