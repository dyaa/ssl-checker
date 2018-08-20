'use strict';

var https = require('https');

/**
 * Checks SSL Expiry date
 * @param {string} host
 * @param {string} method
 * @param {number} port
 * @return {object}
 */
module.exports = (host, method, port) => {
	if (!host) throw new Error("Invalid host");

	const options = {
		host: host,
		method: method || 'HEAD',
		port: port || 443,
		rejectUnauthorized: false,
		agent: false,
	};

	let numericPort = (!isNaN(parseFloat(options.port)) && isFinite(options.port));
	if (numericPort === false) throw new Error("Invalid port");
	let daysBetween = (from, to) => Math.round(Math.abs((+from) - (+to))/8.64e7);

	if (options.host === null || options.port === null) throw new Error("Invalid host or port");
	return new Promise(function(resolve, reject) {
		try {
			const req = https.request(options, res => {
				let { valid_from, valid_to } = res.connection.getPeerCertificate();
				resolve({
					valid_from: valid_from,
					valid_to: valid_to,
					days_remaining: daysBetween(new Date(), new Date(valid_to))
				});
			});
			req.on('error', (e) => { reject(e) });
			req.end();
		} catch (e) {
			reject(e);
		}
	})
};
