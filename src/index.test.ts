import { expect, describe, it } from "vitest";
import * as fs from 'fs';

import sslChecker from "./";

const githubHost = "github.com";
const validSslHost = "badssl.com";
const expiredSSlHost = "expired.badssl.com";
const wrongHostDomain = "wrong.host.badssl.com";

const validDomainsForValidSslHost = ["*.badssl.com", "badssl.com"];

describe("sslChecker", () => {
  it("Should return valid values when valid host is passed", async () => {
    const sslDetails = await sslChecker(validSslHost, {validateSubjectAltName: true});

    expect(sslDetails).toEqual(
      expect.objectContaining({
        daysRemaining: expect.any(Number),
        valid: true,
        validFrom: expect.any(String),
        validTo: expect.any(String),
        validFor: expect.arrayContaining(validDomainsForValidSslHost),
      })
    );
  });

  it("Should work on subsequent calls for the same domain", async () => {
    await sslChecker(validSslHost);
    await new Promise((r) => setTimeout(r, 1000));
    const sslDetails = await sslChecker(validSslHost);

    expect(sslDetails).toEqual(
      expect.objectContaining({
        valid: true,
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
  });

  it("Should allow for specifying `subjectaltname` as a non required field for cert validity", async () => {
    const sslDetails = await sslChecker(validSslHost, {validateSubjectAltName: false});

    expect(sslDetails).toEqual(
      expect.objectContaining({
        daysRemaining: expect.any(Number),
        valid: true,
        validFrom: expect.any(String),
        validTo: expect.any(String),
      })
    );
  });

  it("Should return an error when passing a wrong host domain", async () => {
    try {
      await sslChecker(wrongHostDomain);
    } catch (e) {
      expect(e).toContain(
        "getaddrinfo ENOTFOUND expiredSSlHost expiredSSlHost:"
      );
    }
  });

  it("Should return 'Invalid port' when no port provided", async () => {
    try {
      await sslChecker(validSslHost, { port: "port" });
    } catch (e) {
      expect(e).toEqual(new Error("Invalid port"));
    }
  });

  it("Should not leak socket file descriptors with a head request", async () => {
    if (process.platform !== 'linux') return
    await new Promise((r) => setTimeout(r, 2000));
    const openFdsBefore = fs.readdirSync('/proc/self/fd').length - 1;
    await sslChecker(githubHost, { method: "HEAD", port: 443 })
    await new Promise((r) => setTimeout(r, 1000));
    const openFdsAfter = fs.readdirSync('/proc/self/fd').length - 1;
    expect(openFdsBefore).toEqual(openFdsAfter);
  });

  it("Should not leak socket file descriptors with a get request", async () => {
    if (process.platform !== 'linux') return
    await new Promise((r) => setTimeout(r, 2000));
    const openFdsBefore = fs.readdirSync('/proc/self/fd').length - 1;
    await sslChecker(githubHost, { method: "GET", port: 443 })
    await new Promise((r) => setTimeout(r, 1000));
    const openFdsAfter = fs.readdirSync('/proc/self/fd').length - 1;
    expect(openFdsBefore).toEqual(openFdsAfter);
  });
});
