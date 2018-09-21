'use strict';

const expect = require('chai').expect;
const checker = require('../index');

const validDomain = 'badssl.com';
const expiredDomain = 'expired.badssl.com';
const wrongHostDomain = 'wrong.host.badssl.com';

describe('SSL Checker', () => {
	it('should return correct properties', () =>
		checker(validDomain).then(data => {
			expect(data).to.have.property('valid');
			expect(data).to.have.property('valid_from');
			expect(data).to.have.property('valid_to');
			expect(data).to.have.property('days_remaining');
		})
	);

	it('should return negative days remaining for expired certs ', () =>
		checker(expiredDomain).then(data =>
			expect(data.days_remaining).below(0)
		).catch(console.error)
	);

	it('should throw an error if the certificate is invalid', () =>
		checker(wrongHostDomain).catch(error => {
			expect(error).to.be.an('error');
		})
	);

	it('should throw an error if you try to get unknown domain', done => {
		checker('notADomainName').catch(error => {
			expect(error).to.be.an('error');
			done();
		})
	});
});
