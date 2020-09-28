import * as http from "http";
import * as https from "https";
import * as tls from "tls";

interface IResolvedValues {
  valid: boolean;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  validFor: string[];
}

const checkPort = (port: unknown): boolean =>
  !isNaN(parseFloat(port as string)) && Math.sign(port as number) === 1;
const getDaysBetween = (validFrom: Date, validTo: Date): number =>
  Math.round(Math.abs(+validFrom - +validTo) / 8.64e7);
const getDaysRemaining = (validFrom: Date, validTo: Date): number => {
  const daysRemaining = getDaysBetween(validFrom, validTo);

  if (new Date(validTo).getTime() < new Date().getTime()) {
    return -daysRemaining;
  }

  return daysRemaining;
};

const sslChecker = (
  host: string,
  options: Partial<https.RequestOptions> = {
    agent: false,
    method: "HEAD",
    port: 443,
    rejectUnauthorized: false,
  }
): Promise<IResolvedValues> =>
  new Promise((resolve, reject) => {

    if (!checkPort(options.port)) {
      reject(Error("Invalid port"));
    }

    try {
      const req = https.request(
        { host, ...options },
        (res: http.IncomingMessage) => {
          const {
            valid_from,
            valid_to,
            subjectaltname,
          } = (res.connection as tls.TLSSocket).getPeerCertificate();

          const validTo = new Date(valid_to);

          const validFor = subjectaltname
            .replace(/DNS:|IP Address:/g, "")
            .split(", ");

          resolve({
            daysRemaining: getDaysRemaining(new Date(), validTo),
            valid:
              ((res.socket as { authorized?: boolean })
                .authorized as boolean) || false,
            validFrom: new Date(valid_from).toISOString(),
            validTo: validTo.toISOString(),
            validFor,
          });
        }
      );

      req.on("error", reject);
      req.on("timeout", () => {
          req.abort()
          reject(new Error('Timed Out'))
      });
      req.end();
    } catch (e) {
      reject(e);
    }
  });

export default sslChecker;
module.exports = sslChecker;
