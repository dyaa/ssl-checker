'use strict';

var expect = require('chai').expect;
var asset = require('chai').asset;
var checker = require('../index');

describe('SSL Checker', () => {
	it('should return correct properties', () =>
		checker('dyaa.me').then(data =>
			expect(data).to.have.property('valid_from')
		).catch(console.error)
	);

	it('should return negative days remaining for expired certs ', () =>
		checker('expired.badssl.com').then(data =>
			expect(data.days_remaining).below(0)
		).catch(console.error)
	);

	it('should throw an error if you try to get unknown domain', done => {
		try {
			expect(() => checker('notaDomainName')).not.to.throw(Error);
			done();
		} catch (err) {
			expect(err).to.be.a(Error);
		}
	});
});
