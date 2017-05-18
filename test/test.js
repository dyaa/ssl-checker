'use strict';

var expect = require('chai').expect;
var asset = require('chai').asset;
var checker = require('../index');

describe('SSL Checker', () => {
	it('should return correct properties', () => {
		return checker('dyaa.me').then(data => {
			return expect(data).to.have.property('valid_from');
		}).catch(console.error);
	});
});
