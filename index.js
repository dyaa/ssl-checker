'use strict';

const https = require('https');

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

	const numericPort = (!isNaN(parseFloat(options.port)) && isFinite(options.port));
	const daysBetween = (from, to) => Math.round(Math.abs((+from) - (+to))/8.64e7);

	if (numericPort === false) throw new Error("Invalid port");

	if (options.host === null || options.port === null) throw new Error("Invalid host or port");
	return new Promise((resolve, reject) => {
		try {
			const req = https.request(options, res => {
				const { valid_from, valid_to } = res.connection.getPeerCertificate();
				let days_remaining = daysBetween(new Date(), new Date(valid_to));
				
				// Check if a certificate has already expired
				let now = new Date();
				if (new Date(valid_to).getTime() < now.getTime()){
					days_remaining = -days_remaining;
				}

				resolve({
					valid: res.socket.authorized,
					valid_from,
					valid_to,
					days_remaining,
				});
			});
			req.on('error', e => reject(e));
			req.end();
		} catch (e) {
			reject(e);
		}
	})
};
