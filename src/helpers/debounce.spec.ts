import {expect} from 'chai';
import 'mocha';
import {debounce} from "./debounce";


describe('debounce Function', () => {
	it('should be declared and be accessible from anywhere', () => {
		expect(typeof debounce).to.equal('function');
	});
});