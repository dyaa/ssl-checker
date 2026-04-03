# Node SSL Checker

[![Build Status](https://github.com/dyaa/ssl-checker/workflows/test-sslChecker/badge.svg)](https://github.com/dyaa/ssl-checker/actions)
[![npm version](https://badge.fury.io/js/ssl-checker.svg)](https://badge.fury.io/js/ssl-checker) [![npm](https://img.shields.io/npm/dt/ssl-checker.svg)](https://github.com/dyaa/node-ssl-checker)

Zero-dependency SSL/TLS certificate checker for Node.js. Supports HTTPS, SMTP, IMAP, POP3, and FTP via STARTTLS. Returns certificate expiry, full chain, issuer, subject, protocol, cipher, HSTS, and more.

## Installation

```bash
npm install ssl-checker
```

## CLI

```bash
npx ssl-checker example.com
npx ssl-checker example.com --json
npx ssl-checker example.com --port 8443 --timeout 5000
npx ssl-checker smtp.gmail.com --protocol smtp
npx ssl-checker mail.example.com --protocol imap --port 143
```

## Usage

```ts
import sslChecker from "ssl-checker";

const result = await sslChecker("example.com");
console.log(result);
```

### STARTTLS (SMTP, IMAP, POP3, FTP)

```ts
import sslChecker from "ssl-checker";

const smtp = await sslChecker("smtp.gmail.com", { protocol: "smtp" });
const imap = await sslChecker("mail.example.com", { protocol: "imap", port: 143 });
const pop3 = await sslChecker("mail.example.com", { protocol: "pop3" });
const ftp = await sslChecker("ftp.example.com", { protocol: "ftp" });
```

### Named export

```ts
import { sslChecker } from "ssl-checker";
```

### Batch checking

```ts
import { sslCheckerBatch } from "ssl-checker";

const results = await sslCheckerBatch(["example.com", "github.com"]);
// Map<string, IResolvedValues | Error>
```

## Options

All valid `https.RequestOptions` values, plus:

| Option                 | Default | Description                                        |
| ---------------------- | ------- | -------------------------------------------------- |
| method                 | HEAD    | HTTP method (HEAD or GET, HTTPS only)              |
| port                   | auto    | Port (443, 587, 143, 110, 21 based on protocol)   |
| protocol               | https   | Protocol: `https`, `smtp`, `imap`, `pop3`, `ftp`  |
| agent                  | default | HTTPS agent with `{ maxCachedSessions: 0 }`       |
| rejectUnauthorized     | false   | Skips authorization by default                     |
| validateSubjectAltName | false   | Include Subject Alternative Names in response      |
| timeout                | 10000   | Request timeout in milliseconds                    |
| warnDays               | -       | When set, adds `expiringSoon` boolean to response  |

```ts
sslChecker("example.com", {
  method: "GET",
  port: 443,
  validateSubjectAltName: true,
  timeout: 5000,
  warnDays: 30,
}).then(console.info);
```

## Response

```json
{
  "valid": true,
  "validationError": null,
  "validFrom": "2024-01-01T00:00:00.000Z",
  "validTo": "2025-01-01T23:59:59.000Z",
  "daysRemaining": 90,
  "validFor": ["example.com", "www.example.com"],
  "issuer": { "CN": "R3", "O": "Let's Encrypt", "C": "US" },
  "subject": { "CN": "example.com" },
  "fingerprint256": "AA:BB:CC:...",
  "serialNumber": "0123456789ABCDEF",
  "protocol": "TLSv1.3",
  "cipher": "TLS_AES_256_GCM_SHA384",
  "bits": 256,
  "chain": [
    {
      "subject": { "CN": "R3", "O": "Let's Encrypt", "C": "US" },
      "issuer": { "CN": "ISRG Root X1", "O": "Internet Security Research Group", "C": "US" },
      "validFrom": "2024-03-13T00:00:00.000Z",
      "validTo": "2027-03-12T23:59:59.000Z",
      "fingerprint256": "...",
      "serialNumber": "..."
    }
  ],
  "chainComplete": true,
  "hsts": {
    "enabled": true,
    "maxAge": 31536000,
    "includeSubDomains": true,
    "preload": true
  },
  "expiringSoon": false
}
```

| Field             | Type              | Description                                                    |
| ----------------- | ----------------- | -------------------------------------------------------------- |
| valid             | boolean           | Whether the certificate is valid and trusted                   |
| validationError   | string \| null    | Why validation failed (e.g. `CERT_HAS_EXPIRED`), or null      |
| validFrom         | string            | Certificate issue date (ISO 8601)                              |
| validTo           | string            | Certificate expiry date (ISO 8601)                             |
| daysRemaining     | number            | Days until expiry (negative if already expired)                |
| validFor          | string[]          | Subject alt names (only with `validateSubjectAltName: true`)   |
| issuer            | object            | Certificate authority (`CN`, `O`, `C`)                         |
| subject           | object            | Certificate owner (`CN`, `O`, `C`)                             |
| fingerprint256    | string            | SHA-256 fingerprint                                            |
| serialNumber      | string            | Certificate serial number                                      |
| protocol          | string            | TLS protocol version (e.g. `TLSv1.3`)                         |
| cipher            | string            | Cipher suite name                                              |
| bits              | number            | Key size in bits                                               |
| chain             | object[]          | Certificate chain from leaf issuer to root                     |
| chainComplete     | boolean           | Whether the chain terminates at a self-signed root             |
| hsts              | object \| null    | HSTS header info (`enabled`, `maxAge`, `includeSubDomains`, `preload`) |
| expiringSoon      | boolean           | Only present when `warnDays` option is set                     |

#### License

Copylefted (c) 8008 :trollface: [Dyaa Eldin Moustafa][1] Licensed under the [MIT license][2].

[1]: https://dyaa.me/
[2]: https://github.com/dyaa/node-ssl-checker/blob/master/LICENSE
