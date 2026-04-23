import * as https from "https";
import * as tls from "tls";
import * as net from "net";

interface ICertIssuerSubject {
  CN: string;
  O?: string;
  C?: string;
}

interface IChainCertificate {
  subject: ICertIssuerSubject;
  issuer: ICertIssuerSubject;
  validFrom: string;
  validTo: string;
  fingerprint256: string;
  serialNumber: string;
}

interface IHsts {
  enabled: boolean;
  maxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}

type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

interface IGrade {
  grade: Grade;
  protocols: string[];
  weakCiphers: boolean;
  reasons: string[];
}

interface IResolvedValues {
  valid: boolean;
  validationError: string | null;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  expiringSoon?: boolean;
  validFor?: string[];
  issuer: ICertIssuerSubject;
  subject: ICertIssuerSubject;
  fingerprint256: string;
  serialNumber: string;
  protocol: string;
  cipher: string;
  bits: number;
  chain: IChainCertificate[];
  chainComplete: boolean;
  hsts: IHsts | null;
  grade?: IGrade;
}

type Protocol = "https" | "smtp" | "imap" | "pop3" | "ftp";

type Options = https.RequestOptions & {
  validateSubjectAltName?: boolean;
  timeout?: number;
  warnDays?: number;
  protocol?: Protocol;
  servername?: string;
  grade?: boolean;
};

const DEFAULT_PORTS: Record<Protocol, number> = {
  https: 443,
  smtp: 587,
  imap: 143,
  pop3: 110,
  ftp: 21,
};

const checkPort = (port: unknown): boolean =>
  !isNaN(parseFloat(port as string)) &&
  Math.sign(port as number) === 1 &&
  (port as number) <= 65535;

const getDaysBetween = (validFrom: Date, validTo: Date): number =>
  Math.round(Math.abs(+validFrom - +validTo) / 8.64e7);

const getDaysRemaining = (validFrom: Date, validTo: Date): number => {
  const daysRemaining = getDaysBetween(validFrom, validTo);

  if (new Date(validTo).getTime() < new Date().getTime()) {
    return -daysRemaining;
  }

  return daysRemaining;
};

const toSubject = (obj: Record<string, any>): ICertIssuerSubject => ({
  CN: String(obj?.CN ?? ""),
  O: obj?.O ? String(obj.O) : undefined,
  C: obj?.C ? String(obj.C) : undefined,
});

const extractCertData = (
  socket: tls.TLSSocket,
  opts: { validateSubjectAltName?: boolean; warnDays?: number; hsts?: IHsts | null }
): IResolvedValues | Error => {
  const cert = socket.getPeerCertificate(true);
  const { valid_from, valid_to, subjectaltname } = cert;
  const { issuer, subject, fingerprint256, serialNumber, bits } = cert;
  const authError = socket.authorizationError;
  const validationError = authError ? String(authError) : null;
  const protocol = socket.getProtocol() || "unknown";
  const cipherInfo = socket.getCipher();

  if (!valid_from || !valid_to) {
    return new Error("No certificate");
  }

  const chain: IChainCertificate[] = [];
  const seen = new Set<string>();
  let current = cert.issuerCertificate;
  while (current && current.fingerprint256 && !seen.has(current.fingerprint256)) {
    seen.add(current.fingerprint256);
    chain.push({
      subject: toSubject(current.subject),
      issuer: toSubject(current.issuer),
      validFrom: new Date(current.valid_from).toISOString(),
      validTo: new Date(current.valid_to).toISOString(),
      fingerprint256: current.fingerprint256,
      serialNumber: current.serialNumber,
    });
    current = current.issuerCertificate as typeof current;
  }
  const chainComplete = chain.length > 0 &&
    chain[chain.length - 1].subject.CN === chain[chain.length - 1].issuer.CN;

  const validTo = new Date(valid_to);

  const result: IResolvedValues = {
    daysRemaining: getDaysRemaining(new Date(), validTo),
    valid: !validationError,
    validationError,
    validFrom: new Date(valid_from).toISOString(),
    validTo: validTo.toISOString(),
    issuer: toSubject(issuer),
    subject: toSubject(subject),
    fingerprint256,
    serialNumber,
    protocol,
    cipher: cipherInfo ? cipherInfo.name : "unknown",
    bits: bits || 0,
    chain,
    chainComplete,
    hsts: opts.hsts ?? null,
  };

  if (opts.validateSubjectAltName && subjectaltname) {
    result.validFor = subjectaltname
      .replace(/DNS:|IP Address:/g, "")
      .split(", ");
  }

  if (opts.warnDays != null) {
    result.expiringSoon = result.daysRemaining <= opts.warnDays;
  }

  return result;
};

const normalizeError = (err: unknown): Error => {
  if (err instanceof Error) {
    if (!err.message && (err as NodeJS.ErrnoException).code) {
      err.message = (err as NodeJS.ErrnoException).code as string;
    }
    return err;
  }
  return new Error(String(err));
};

const readLine = (socket: net.Socket): Promise<string> =>
  new Promise((resolve) => {
    let data = "";
    const onData = (chunk: Buffer) => {
      data += chunk.toString();
      if (data.includes("\r\n")) {
        socket.removeListener("data", onData);
        resolve(data.trim());
      }
    };
    socket.on("data", onData);
  });

const readMultiLine = (socket: net.Socket): Promise<string> =>
  new Promise((resolve) => {
    let data = "";
    const onData = (chunk: Buffer) => {
      data += chunk.toString();
      const lines = data.split("\r\n");
      for (const line of lines) {
        if (line.length >= 4 && line[3] === " ") {
          socket.removeListener("data", onData);
          resolve(data.trim());
          return;
        }
      }
    };
    socket.on("data", onData);
  });

const starttlsHandshake = async (
  socket: net.Socket,
  protocol: Protocol
): Promise<void> => {
  switch (protocol) {
    case "smtp":
      await readMultiLine(socket);
      socket.write("EHLO ssl-checker\r\n");
      await readMultiLine(socket);
      socket.write("STARTTLS\r\n");
      await readLine(socket);
      break;
    case "imap":
      await readLine(socket);
      socket.write("a001 STARTTLS\r\n");
      await readLine(socket);
      break;
    case "pop3":
      await readLine(socket);
      socket.write("STLS\r\n");
      await readLine(socket);
      break;
    case "ftp":
      await readLine(socket);
      socket.write("AUTH TLS\r\n");
      await readLine(socket);
      break;
  }
};

const checkStarttls = (
  host: string,
  port: number,
  proto: Protocol,
  timeout: number,
  opts: { validateSubjectAltName?: boolean; warnDays?: number; rejectUnauthorized?: boolean; servername?: string }
): Promise<IResolvedValues> =>
  new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, async () => {
      try {
        await starttlsHandshake(socket, proto);

        const tlsSocket = tls.connect({
          socket,
          servername: opts.servername || host,
          rejectUnauthorized: opts.rejectUnauthorized ?? false,
        }, () => {
          const result = extractCertData(tlsSocket, {
            validateSubjectAltName: opts.validateSubjectAltName,
            warnDays: opts.warnDays,
            hsts: null,
          });
          tlsSocket.destroy();
          if (result instanceof Error) {
            reject(result);
          } else {
            resolve(result);
          }
        });

        tlsSocket.on("error", (err) => {
          tlsSocket.destroy();
          reject(normalizeError(err));
        });
      } catch (err) {
        socket.destroy();
        reject(normalizeError(err));
      }
    });

    socket.setTimeout(timeout, () => {
      socket.destroy();
      reject(new Error("Timed Out"));
    });
    socket.on("error", (err) => reject(normalizeError(err)));
  });

const WEAK_CIPHERS = [
  "RC4", "DES", "3DES", "NULL", "EXPORT", "anon",
  "MD5", "RC2", "IDEA", "SEED",
].join(":");

const probeProtocol = (
  host: string,
  port: number,
  version: tls.SecureVersion,
  timeout: number,
  servername?: string
): Promise<boolean> =>
  new Promise((resolve) => {
    const socket = tls.connect({
      host,
      port,
      servername: servername || host,
      minVersion: version,
      maxVersion: version,
      rejectUnauthorized: false,
    }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.setTimeout(timeout, () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
  });

const probeWeakCiphers = (
  host: string,
  port: number,
  timeout: number,
  servername?: string
): Promise<boolean> =>
  new Promise((resolve) => {
    const socket = tls.connect({
      host,
      port,
      servername: servername || host,
      ciphers: WEAK_CIPHERS,
      maxVersion: "TLSv1.2",
      rejectUnauthorized: false,
    }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.setTimeout(timeout, () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
  });

const GRADE_ORDER: Grade[] = ["A+", "A", "B", "C", "D", "F"];

const downgrade = (current: Grade, to: Grade): Grade => {
  const ci = GRADE_ORDER.indexOf(current);
  const ti = GRADE_ORDER.indexOf(to);
  return ti > ci ? to : current;
};

const computeGrade = async (
  host: string,
  port: number,
  timeout: number,
  result: IResolvedValues,
  servername?: string
): Promise<IGrade> => {
  const probeTimeout = Math.min(timeout, 5000);

  const [hasTls10, hasTls11, hasTls12, hasTls13, hasWeakCiphers] = await Promise.all([
    probeProtocol(host, port, "TLSv1" as tls.SecureVersion, probeTimeout, servername),
    probeProtocol(host, port, "TLSv1.1" as tls.SecureVersion, probeTimeout, servername),
    probeProtocol(host, port, "TLSv1.2", probeTimeout, servername),
    probeProtocol(host, port, "TLSv1.3", probeTimeout, servername),
    probeWeakCiphers(host, port, probeTimeout, servername),
  ]);

  const protocols: string[] = [];
  if (hasTls10) protocols.push("TLSv1.0");
  if (hasTls11) protocols.push("TLSv1.1");
  if (hasTls12) protocols.push("TLSv1.2");
  if (hasTls13) protocols.push("TLSv1.3");

  const reasons: string[] = [];
  let grade: Grade = "A+";

  if (!result.valid) {
    reasons.push("Certificate is not valid: " + (result.validationError || "unknown error"));
    return { grade: "F", protocols, weakCiphers: hasWeakCiphers, reasons };
  }

  if (result.daysRemaining <= 0) {
    reasons.push("Certificate has expired");
    return { grade: "F", protocols, weakCiphers: hasWeakCiphers, reasons };
  }

  if (!result.chainComplete) {
    reasons.push("Incomplete certificate chain");
    grade = downgrade(grade, "B");
  }

  if (hasTls10) {
    reasons.push("TLSv1.0 supported (deprecated)");
    grade = downgrade(grade, "C");
  }

  if (hasTls11) {
    reasons.push("TLSv1.1 supported (deprecated)");
    grade = downgrade(grade, "B");
  }

  if (hasWeakCiphers) {
    reasons.push("Weak ciphers accepted");
    grade = downgrade(grade, "B");
  }

  if (!hasTls13) {
    reasons.push("TLSv1.3 not supported");
    grade = downgrade(grade, "A");
  }

  if (result.bits < 128) {
    reasons.push("Key size below 128 bits");
    grade = downgrade(grade, "B");
  }

  if (grade === "A+") {
    if (!result.hsts) {
      reasons.push("HSTS not enabled");
      grade = "A";
    } else if (result.hsts.maxAge && result.hsts.maxAge < 15768000) {
      reasons.push("HSTS max-age below 6 months");
      grade = "A";
    }
  }

  if (reasons.length === 0) {
    reasons.push("No issues found");
  }

  return { grade, protocols, weakCiphers: hasWeakCiphers, reasons };
};

const DEFAULT_OPTIONS: Partial<Options> = {
  agent: new https.Agent({
    maxCachedSessions: 0,
  }),
  method: "HEAD",
  port: undefined,
  rejectUnauthorized: false,
  validateSubjectAltName: false,
  timeout: 10000,
  protocol: "https",
};

const sslChecker = (
  host: string,
  options: Partial<Options> = {}
): Promise<IResolvedValues> => {
  const merged = Object.assign({}, DEFAULT_OPTIONS, options);
  const { validateSubjectAltName, timeout, warnDays, protocol: proto, grade: doGrade, ...requestOptions } = merged;
  const effectiveProto = proto || "https";
  const effectivePort = requestOptions.port || DEFAULT_PORTS[effectiveProto];
  requestOptions.port = effectivePort;

  if (!checkPort(effectivePort)) {
    return Promise.reject(Error("Invalid port"));
  }

  const getBaseResult = (): Promise<IResolvedValues> => {
    if (effectiveProto !== "https") {
      return checkStarttls(host, effectivePort as number, effectiveProto, timeout as number, {
        validateSubjectAltName,
        warnDays,
        rejectUnauthorized: requestOptions.rejectUnauthorized as boolean,
        servername: requestOptions.servername as string | undefined,
      });
    }

    return new Promise((resolve, reject) => {
      try {
        const req = https.request(
          { host, ...requestOptions },
          (res) => {
            const socket = res.socket as tls.TLSSocket;

            const hstsHeader = res.headers["strict-transport-security"];
            let hsts: IHsts | null = null;
            if (hstsHeader) {
              const maxAgeMatch = hstsHeader.match(/max-age=(\d+)/);
              hsts = {
                enabled: true,
                maxAge: maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : undefined,
                includeSubDomains: hstsHeader.includes("includeSubDomains"),
                preload: hstsHeader.includes("preload"),
              };
            }

            const result = extractCertData(socket, { validateSubjectAltName, warnDays, hsts });
            res.socket.destroy();

            if (result instanceof Error) {
              reject(result);
            } else {
              resolve(result);
            }
          }
        );

        req.setTimeout(timeout as number, () => {
          req.destroy();
          reject(new Error("Timed Out"));
        });
        req.on("error", (err) => reject(normalizeError(err)));
        req.end();
      } catch (e) {
        reject(normalizeError(e));
      }
    });
  };

  return getBaseResult().then(async (result) => {
    if (doGrade) {
      result.grade = await computeGrade(
        host,
        effectivePort as number,
        timeout as number,
        result,
        requestOptions.servername as string | undefined
      );
    }
    return result;
  });
};

const sslCheckerBatch = async (
  hosts: string[],
  options: Partial<Options> = {}
): Promise<Map<string, IResolvedValues | Error>> => {
  const results = await Promise.allSettled(
    hosts.map((host) => sslChecker(host, options))
  );

  const map = new Map<string, IResolvedValues | Error>();
  hosts.forEach((host, i) => {
    const result = results[i];
    map.set(
      host,
      result.status === "fulfilled" ? result.value : result.reason
    );
  });

  return map;
};

export { sslChecker, sslCheckerBatch };
export default sslChecker;
