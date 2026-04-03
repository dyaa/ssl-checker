import sslChecker from "./index";

const args = process.argv.slice(2);

const flags: Record<string, string> = {};
const positional: string[] = [];

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--") && i + 1 < args.length && !args[i + 1].startsWith("--")) {
    flags[args[i].slice(2)] = args[i + 1];
    i++;
  } else if (args[i].startsWith("--")) {
    flags[args[i].slice(2)] = "true";
  } else {
    positional.push(args[i]);
  }
}

const host = positional[0];

if (!host || flags.help) {
  console.log(`Usage: ssl-checker <host> [options]

Options:
  --port <number>       Port to connect to (default: auto by protocol)
  --protocol <proto>    Protocol: https, smtp, imap, pop3, ftp (default: https)
  --timeout <ms>        Timeout in milliseconds (default: 10000)
  --grade               Run SSL grading (A+ to F)
  --json                Output raw JSON
  --help                Show this help message`);
  process.exit(host ? 0 : 1);
}

const port = flags.port ? parseInt(flags.port, 10) : undefined;
const timeout = flags.timeout ? parseInt(flags.timeout, 10) : undefined;
const protocol = flags.protocol as "https" | "smtp" | "imap" | "pop3" | "ftp" | undefined;
const doGrade = flags.grade === "true";
const jsonOutput = flags.json === "true";

async function main() {
  try {
    const result = await sslChecker(host, {
      ...(port && { port }),
      ...(timeout && { timeout }),
      ...(protocol && { protocol }),
      validateSubjectAltName: true,
      grade: doGrade,
    });

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const status = result.valid ? "\x1b[32m\u2713 Valid\x1b[0m" : "\x1b[31m\u2717 Invalid\x1b[0m";
      console.log(`\n  SSL Certificate for \x1b[1m${host}\x1b[0m\n`);
      console.log(`  Status:         ${status}`);
      if (result.validationError) {
        console.log(`  Error:          \x1b[31m${result.validationError}\x1b[0m`);
      }
      console.log(`  Days Remaining: ${result.daysRemaining}`);
      console.log(`  Valid From:     ${result.validFrom}`);
      console.log(`  Valid To:       ${result.validTo}`);
      console.log(`  Subject:        ${result.subject.CN}`);
      console.log(`  Issuer:         ${result.issuer.CN}${result.issuer.O ? ` (${result.issuer.O})` : ""}`);
      console.log(`  Protocol:       ${result.protocol}`);
      console.log(`  Cipher:         ${result.cipher}`);
      console.log(`  Bits:           ${result.bits}`);
      console.log(`  Fingerprint:    ${result.fingerprint256}`);
      console.log(`  Serial:         ${result.serialNumber}`);
      if (result.validFor) {
        console.log(`  Valid For:      ${result.validFor.join(", ")}`);
      }

      const chainStatus = result.chainComplete ? "\x1b[32m\u2713 Complete\x1b[0m" : "\x1b[33m\u2717 Incomplete\x1b[0m";
      console.log(`  Chain:          ${chainStatus} (${result.chain.length + 1} certificates)`);
      console.log(`                  ${result.subject.CN}`);
      for (const link of result.chain) {
        console.log(`                  \u2514\u2500 ${link.subject.CN}${link.subject.O ? ` (${link.subject.O})` : ""}`);
      }

      if (result.hsts) {
        const parts = [`max-age=${result.hsts.maxAge}`];
        if (result.hsts.includeSubDomains) parts.push("includeSubDomains");
        if (result.hsts.preload) parts.push("preload");
        console.log(`  HSTS:           \x1b[32menabled\x1b[0m (${parts.join(", ")})`);
      } else {
        console.log(`  HSTS:           \x1b[33mnot set\x1b[0m`);
      }

      if (result.grade) {
        const g = result.grade;
        const gradeColors: Record<string, string> = {
          "A+": "\x1b[32m", "A": "\x1b[32m",
          "B": "\x1b[33m", "C": "\x1b[33m",
          "D": "\x1b[31m", "F": "\x1b[31m",
        };
        const color = gradeColors[g.grade] || "";
        console.log(`  Grade:          ${color}${g.grade}\x1b[0m`);
        console.log(`  Protocols:      ${g.protocols.join(", ")}`);
        if (g.reasons[0] !== "No issues found") {
          for (const reason of g.reasons) {
            console.log(`                  \x1b[33m- ${reason}\x1b[0m`);
          }
        }
      }
      console.log();
    }

    process.exit(result.valid ? 0 : 1);
  } catch (err) {
    if (jsonOutput) {
      console.log(JSON.stringify({ host, error: (err as Error).message }));
    } else {
      console.error(`\x1b[31m  Error checking ${host}: ${(err as Error).message}\x1b[0m`);
    }
    process.exit(1);
  }
}

main();
