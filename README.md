# Node SSL Checker

[![wercker status](https://app.wercker.com/status/d9c8e99c45ac59552e86375ac942697b/s/master "wercker status")](https://app.wercker.com/project/byKey/d9c8e99c45ac59552e86375ac942697b) [![npm version](https://badge.fury.io/js/ssl-checker.svg)](https://badge.fury.io/js/ssl-checker) [![npm](https://img.shields.io/npm/dt/ssl-checker.svg)](https://github.com/dyaa/node-ssl-checker)

## Installation
Simply add `ssl-checker` as a dependency:
```bash
$ npm install ssl-checker --save # npm i -s ssl-checker

# Or if you are using yarn (https://yarnpkg.com/lang/en/)
$ yarn add ssl-checker
```

## Usage

```javascript
import sslChecker from 'ssl-checker';

sslChecker("github.com").then(console.log).catch(console.error);
sslChecker("github").then(console.log).catch((err) => {
  if (err.code === 'ENOTFOUND') {
    console.log("Please get back only or fix hostname");
  } else {
    console.error(err);
  }
});
```

## Options
| Option | Default  |                         |
| ------ | -------- | ----------------------- |
| Host   | Required | your host *ex. github.com* |
| Method | HEAD     | can be GET too          |
| Port   | 443      | Your ssl port number    |

```javascript
var sslChecker = require("ssl-checker")
sslChecker('dyaa.me', 'GET', 443).then(result => console.info(result));
```

## Response Example
```json
{
	"valid": true,
	"days_remaining" : 90,
	"valid_from" : "issue date",
	"valid_to" : "expiry date"
}
```

#### License

Copylefted (c) 2018 [Dyaa Eldin Moustafa][1] Licensed under the [MIT license][2].


  [1]: https://dyaa.me/
  [2]: https://github.com/dyaa/node-ssl-checker/blob/master/LICENSE
