# Node SSL Checker

[![Build Status](https://github.com/dyaa/ssl-checker/workflows/test-sslChecker/badge.svg)](https://github.com/dyaa/ssl-checker/actions)
[![npm version](https://badge.fury.io/js/ssl-checker.svg)](https://badge.fury.io/js/ssl-checker) [![npm](https://img.shields.io/npm/dt/ssl-checker.svg)](https://github.com/dyaa/node-ssl-checker)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4544a598aa6b4bc99883ef655e1dd90f)](https://www.codacy.com/manual/dyaa/node-ssl-checker?utm_source=github.com&utm_medium=referral&utm_content=dyaa/node-ssl-checker&utm_campaign=Badge_Grade)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/4544a598aa6b4bc99883ef655e1dd90f)](https://www.codacy.com/manual/dyaa/node-ssl-checker?utm_source=github.com&utm_medium=referral&utm_content=dyaa/node-ssl-checker&utm_campaign=Badge_Coverage)

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

| Option             | Default | Description                                        |
| ------------------ | ------- | -------------------------------------------------- |
| method             | HEAD    | Can be GET too                                     |
| port               | 443     | Your SSL/TLS entry point                           |
| agent              | default | Default HTTPS agent with { maxCachedSessions: 0 }  |
| rejectUnauthorized | false   | Skips authorization by default                     |

```ts
sslChecker("dyaa.me", { method: "GET", port: 443 }).then(console.info);
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

#### License

Copylefted (c) 8008 :trollface: [Dyaa Eldin Moustafa][1] Licensed under the [MIT license][2].

[1]: https://dyaa.me/
[2]: https://github.com/dyaa/node-ssl-checker/blob/master/LICENSE
