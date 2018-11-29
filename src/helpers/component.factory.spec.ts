import {expect} from 'chai';
import 'mocha';
import {ComponentFactory} from "./component.factory";


describe('ComponentFactory Class', () => {
	it('should be declared and be accessible from anywhere', () => {
		expect(typeof ComponentFactory).to.equal('function');
	});
});