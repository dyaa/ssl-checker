import { expect, describe, it } from "vitest";
import * as fs from 'fs';

import sslChecker, { sslChecker as namedSslChecker, sslCheckerBatch } from "./";

const githubHost = "github.com";
const expiredSSlHost = "expired.badssl.com";
const wrongHostDomain = "wrong.host.badssl.com";

describe("sslChecker", () => {
  it("Should return valid values when valid host is passed", async () => {
    const sslDetails = await sslChecker(githubHost, {validateSubjectAltName: true});

    expect(sslDetails).toEqual(
      expect.objectContaining({
        daysRemaining: expect.any(Number),
        valid: true,
        validationError: null,
        validFrom: expect.any(String),
        validTo: expect.any(String),
        validFor: expect.arrayContaining(["github.com", "www.github.com"]),
      })
    );
  });

  it("Should work on subsequent calls for the same domain", async () => {
    await sslChecker(githubHost);
    await new Promise((r) => setTimeout(r, 1000));
    const sslDetails = await sslChecker(githubHost);

    expect(sslDetails).toEqual(
      expect.objectContaining({
        valid: true,
        validationError: null,
      })
    );
  });

  it("Should return valid = false when provided an expired domain", async () => {
    const sslDetails = await sslChecker(expiredSSlHost);

    expect(sslDetails).toEqual(
      expect.objectContaining({
        valid: false,
      })
    );
    expect(sslDetails.validationError).toBeTruthy();
  });

  it("Should return validationError for wrong host", async () => {
    const sslDetails = await sslChecker(wrongHostDomain);

    expect(sslDetails.valid).toBe(false);
    expect(sslDetails.validationError).toBeTruthy();
  });

  it("Should allow for specifying `subjectaltname` as a non required field for cert validity", async () => {
    const sslDetails = await sslChecker(githubHost, {validateSubjectAltName: false});

    expect(sslDetails).toEqual(
      expect.objectContaining({
        daysRemaining: expect.any(Number),
        valid: true,
        validationError: null,
        validFrom: expect.any(String),
        validTo: expect.any(String),
      })
    );
    expect(sslDetails.validFor).toBeUndefined();
  });

  it("Should return an error when passing a wrong host domain", async () => {
    try {
      await sslChecker("this.domain.does.not.exist.example");
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it("Should return 'Invalid port' when no port provided", async () => {
    try {
      await sslChecker(githubHost, { port: "port" });
    } catch (e) {
      expect(e).toEqual(new Error("Invalid port"));
    }
  });

  it("Should return rich certificate metadata", async () => {
    const sslDetails = await sslChecker(githubHost);

    expect(sslDetails.issuer).toBeDefined();
    expect(sslDetails.issuer.CN).toEqual(expect.any(String));
    expect(sslDetails.subject).toBeDefined();
    expect(sslDetails.subject.CN).toEqual(expect.any(String));
    expect(sslDetails.fingerprint256).toEqual(expect.any(String));
    expect(sslDetails.fingerprint256).toContain(":");
    expect(sslDetails.serialNumber).toEqual(expect.any(String));
    expect(sslDetails.protocol).toEqual(expect.any(String));
    expect(sslDetails.protocol).not.toBe("unknown");
    expect(sslDetails.cipher).toEqual(expect.any(String));
    expect(sslDetails.cipher).not.toBe("unknown");
    expect(sslDetails.bits).toEqual(expect.any(Number));
  });

  it("Should return certificate chain", async () => {
    const sslDetails = await sslChecker(githubHost);

    expect(sslDetails.chain).toEqual(expect.any(Array));
    expect(sslDetails.chain.length).toBeGreaterThanOrEqual(1);

    const firstLink = sslDetails.chain[0];
    expect(firstLink.subject).toBeDefined();
    expect(firstLink.subject.CN).toEqual(expect.any(String));
    expect(firstLink.issuer).toBeDefined();
    expect(firstLink.fingerprint256).toEqual(expect.any(String));
    expect(firstLink.serialNumber).toEqual(expect.any(String));
    expect(firstLink.validFrom).toEqual(expect.any(String));
    expect(firstLink.validTo).toEqual(expect.any(String));

    expect(sslDetails.chainComplete).toBe(true);
  });

  it("Should return HSTS info for github.com", async () => {
    const sslDetails = await sslChecker(githubHost);

    expect(sslDetails.hsts).not.toBeNull();
    expect(sslDetails.hsts!.enabled).toBe(true);
    expect(sslDetails.hsts!.maxAge).toEqual(expect.any(Number));
  });

  it("Should work with named export", async () => {
    const sslDetails = await namedSslChecker(githubHost);

    expect(sslDetails).toEqual(
      expect.objectContaining({
        valid: true,
        validationError: null,
      })
    );
  });

  it("Should return expiringSoon when warnDays is set", async () => {
    const sslDetails = await sslChecker(githubHost, { warnDays: 365 });
    expect(sslDetails.expiringSoon).toBe(true);

    const sslDetails2 = await sslChecker(githubHost, { warnDays: 1 });
    expect(sslDetails2.expiringSoon).toBe(false);
  });

  it("Should return grade when grade option is set", async () => {
    const sslDetails = await sslChecker(githubHost, { grade: true });

    expect(sslDetails.grade).toBeDefined();
    expect(sslDetails.grade!.grade).toBe("A+");
    expect(sslDetails.grade!.protocols).toEqual(expect.any(Array));
    expect(sslDetails.grade!.protocols.length).toBeGreaterThanOrEqual(1);
    expect(sslDetails.grade!.weakCiphers).toBe(false);
    expect(sslDetails.grade!.reasons).toEqual(expect.any(Array));
  }, 15000);

  it("Should return F grade for expired cert", async () => {
    const sslDetails = await sslChecker(expiredSSlHost, { grade: true });

    expect(sslDetails.grade).toBeDefined();
    expect(sslDetails.grade!.grade).toBe("F");
  }, 15000);

  it("Should not include grade when grade option is not set", async () => {
    const sslDetails = await sslChecker(githubHost);
    expect(sslDetails.grade).toBeUndefined();
  });

  it("Should not include expiringSoon when warnDays is not set", async () => {
    const sslDetails = await sslChecker(githubHost);
    expect(sslDetails.expiringSoon).toBeUndefined();
  });

  it("Should batch check multiple hosts", async () => {
    const results = await sslCheckerBatch([githubHost, expiredSSlHost]);

    expect(results.size).toBe(2);

    const github = results.get(githubHost);
    expect(github).toBeDefined();
    expect((github as any).valid).toBe(true);

    const expired = results.get(expiredSSlHost);
    expect(expired).toBeDefined();
    expect((expired as any).valid).toBe(false);
  });

  it("Should handle errors in batch gracefully", async () => {
    const results = await sslCheckerBatch([githubHost, "this.domain.does.not.exist.example"]);

    expect(results.size).toBe(2);

    const github = results.get(githubHost);
    expect((github as any).valid).toBe(true);

    const bad = results.get("this.domain.does.not.exist.example");
    expect(bad).toBeInstanceOf(Error);
  });

  it("Should check SMTP STARTTLS certificate", async () => {
    const sslDetails = await sslChecker("smtp.gmail.com", { protocol: "smtp", port: 587, timeout: 15000 });

    expect(sslDetails.valid).toBe(true);
    expect(sslDetails.subject.CN).toBe("smtp.gmail.com");
    expect(sslDetails.protocol).toEqual(expect.any(String));
    expect(sslDetails.chain.length).toBeGreaterThanOrEqual(1);
    expect(sslDetails.hsts).toBeNull();
  });

  it("Should use default port for protocol", async () => {
    const sslDetails = await sslChecker("smtp.gmail.com", { protocol: "smtp", timeout: 15000 });

    expect(sslDetails.valid).toBe(true);
    expect(sslDetails.subject.CN).toBe("smtp.gmail.com");
  });

  it("Should not leak socket file descriptors with a head request", async () => {
    if (process.platform !== 'linux') return;
    await new Promise((r) => setTimeout(r, 2000));
    const openFdsBefore = fs.readdirSync('/proc/self/fd').length - 1;
    await sslChecker(githubHost, { method: "HEAD", port: 443 });
    await new Promise((r) => setTimeout(r, 1000));
    const openFdsAfter = fs.readdirSync('/proc/self/fd').length - 1;
    expect(openFdsBefore).toEqual(openFdsAfter);
  });

  it("Should not leak socket file descriptors with a get request", async () => {
    if (process.platform !== 'linux') return;
    await new Promise((r) => setTimeout(r, 2000));
    const openFdsBefore = fs.readdirSync('/proc/self/fd').length - 1;
    await sslChecker(githubHost, { method: "GET", port: 443 });
    await new Promise((r) => setTimeout(r, 1000));
    const openFdsAfter = fs.readdirSync('/proc/self/fd').length - 1;
    expect(openFdsBefore).toEqual(openFdsAfter);
  });
});
