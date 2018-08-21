'use strict';

const expect = require('chai').expect;
const asset = require('chai').asset;
const checker = require('../index');

const validDomain = 'github.com';
const expiredDomain = 'expired.badssl.com';

describe('SSL Checker', () => {
	it('should return correct properties', () =>
		checker(validDomain).then(data =>
			expect(data).to.have.property('valid_from')
		).catch(console.error)
	);

	it('should return negative days remaining for expired certs ', () =>
		checker(expiredDomain).then(data =>
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
