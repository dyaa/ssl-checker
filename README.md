# Node SSL Checker

[![Build Status](https://github.com/dyaa/ssl-checker/workflows/test-sslChecker/badge.svg)](https://github.com/dyaa/ssl-checker/actions)
[![npm version](https://badge.fury.io/js/ssl-checker.svg)](https://badge.fury.io/js/ssl-checker) [![npm](https://img.shields.io/npm/dt/ssl-checker.svg)](https://github.com/dyaa/node-ssl-checker)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/48857294fa4a42b79710ffc87b58a72b)](https://www.codacy.com/gh/dyaa/ssl-checker/dashboard?utm_source=github.com&utm_medium=referral&utm_content=dyaa/ssl-checker&utm_campaign=Badge_Coverage)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/48857294fa4a42b79710ffc87b58a72b)](https://www.codacy.com/gh/dyaa/ssl-checker/dashboard?utm_source=github.com&utm_medium=referral&utm_content=dyaa/ssl-checker&utm_campaign=Badge_Grade)

## Installation

Simply add `ssl-checker` as a dependency:

```bash
$ npm install ssl-checker --save # npm i -s ssl-checker

# Or if you prefer using yarn (https://yarnpkg.com/lang/en/)
$ yarn add ssl-checker
```

## Usage

```ts
import sslChecker from "ssl-checker";

const getSslDetails = async (hostname: string) =>
  await sslChecker(hostname`ex. badssl.com`);
```

## Options

All valid `https.RequestOptions` values.

| Option                 | Default | Description                                       |
| ------------------     | ------- | ------------------------------------------------- |
| method                 | HEAD    | Can be GET too                                    |
| port                   | 443     | Your SSL/TLS entry point                          |
| agent                  | default | Default HTTPS agent with { maxCachedSessions: 0 } |
| rejectUnauthorized     | false   | Skips authorization by default                    |
| validateSubjectAltName | false   | Skips returning/validating `subjectaltname`       |

```ts
sslChecker("dyaa.me", { method: "GET", port: 443, validateSubjectAltName: true }).then(console.info);
```

## Response Example

```json
{
  "daysRemaining": 90,
  "valid": true,
  "validFrom": "issue date",
  "validTo": "expiry date",
  "validFor": ["www.example.com", "example.com"]
}
```

**NOTE: `validFor` is only returned if `validateSubjectAltName` is set to `true`**

#### License

Copylefted (c) 8008 :trollface: [Dyaa Eldin Moustafa][1] Licensed under the [MIT license][2].

[1]: https://dyaa.me/
[2]: https://github.com/dyaa/node-ssl-checker/blob/master/LICENSE
