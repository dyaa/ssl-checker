import sslChecker from "../";

const validSslHost = "badssl.com";
const expiredSSlHost = "expired.badssl.com";
const wrongHostDomain = "wrong.host.badssl.com";

const validDomainsForValidSslHost = ["*.badssl.com", "badssl.com"];

describe("sslChecker", () => {
  it("Should return valid values when valid host is passed", async () => {
    const sslDetails = await sslChecker(validSslHost);

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

  it("Should return valid = false when provided an expired domain", async () => {
    const sslDetails = await sslChecker(expiredSSlHost);

    expect(sslDetails).toEqual(
      expect.objectContaining({
        valid: false
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
});
