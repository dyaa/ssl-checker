# Node SSL Checker

[![Greenkeeper badge](https://badges.greenkeeper.io/dyaa/node-ssl-checker.svg)](https://greenkeeper.io/)
[![npm version](https://badge.fury.io/js/ssl-checker.svg)](https://badge.fury.io/js/ssl-checker) [![wercker status](https://app.wercker.com/status/6d674e83dd3412cc21f7bd90e639755d/s/master "wercker status")](https://app.wercker.com/project/byKey/6d674e83dd3412cc21f7bd90e639755d)  [![npm](https://img.shields.io/npm/dt/ssl-checker.svg)](https://github.com/dyaa/node-ssl-checker)

## Installation
Simply add Caporal as a dependency:
```bash
$ npm install ssl-checker --save # npm i -s ssh-checker

# Or if you are using yarn (https://yarnpkg.com/lang/en/)
$ yarn add ssl-checker
```

## Usage

```javascript
var sslChecker = require("ssl-checker")

sslChecker('dyaa.me').then(result => console.info(result));
```

## Options
| Option | Default |  |
| ------ | ------ | ------ |
| Host | Required | your host *ex. dyaa.me* |
| Method | HEAD | can be GET too |
| Port | 443 | Your ssl port number |

```javascript
var sslChecker = require("ssl-checker")
sslChecker('dyaa.me', 'GET', 443).then(result => console.info(result));
```

## Response Example
```json
{
	"days_remaining" : 90,
	"valid_from" : "issue date",
	"valid_to" : "expiry date"
}
```

#### License

Copylefted (c) 2018 [Dyaa Eldin Moustafa][1] Licensed under the [MIT license][2].


  [1]: https://dyaa.me/
  [2]: https://github.com/dyaa/node-ssl-checker/blob/master/LICENSE
