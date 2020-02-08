import {HtmlElementUtility} from "./html-element-utility";
import {AbstractComponent} from "../classes/abstract.component";

/**
 * @description
 * Any Component that is being created should normaly register itself automatically in this registry.
 * The component can then be retrieved on runtime via selector and identifier.
 */
export const ComponentRegistry = new class {
	/**
	 * @description
	 * The references of all components are gonna registered here
	 * @type {{}}
	 */
	public componentRegister: { [index: string]: AbstractComponent[] } = {};

	/**
	 * @description
	 * A map of HTMLElements to their initialized components.
	 * @type {{}}
	 */
	public elementToComponentRegister: WeakMap<Element, AbstractComponent[]> = new WeakMap<Element, AbstractComponent[]>();

	/**
	 * @description
	 * A map of selectors to the class definition. Allows for us to easy create
	 * new components when we find them
	 */
	public componentDefinitions: Map<string, any> = new Map();

	/**
	 * @description
	 * Register the component in the local componentRegister object
	 * @param {string} selector the selector, configured via Component Decorator
	 * @param {AbstractComponent} individualComponent
	 */
	public registerComponent(selector: string, individualComponent: AbstractComponent): void {
		if (typeof this.componentRegister[selector] === 'undefined') {
			this.componentRegister[selector] = [];
		}
		this.componentRegister[selector].push(individualComponent);
	}

	/**
	 * @description
	 * Returns all Component Objects, created for the given selector
	 * @param {string} selector
	 * @return {*}
	 */
	public getComponentsBySelector(selector: string): AbstractComponent[] {
		return this.componentRegister[selector];
	}

	/**
	 * @description
	 * Returns all Component Objects found for the given selector with the given value
	 * @param {string} selector
	 * @param {string} identifier
	 * @return {*}
	 */
	public getComponentsBySelectorAndIdentifier(selector: string, identifier: string): AbstractComponent[] {
		const components = this.getComponentsBySelector(selector);
		return components.filter((element: AbstractComponent) => {
			return HtmlElementUtility.getSelectorValue(selector, element.element) === identifier;
		});
	}

	/**
	 * @description
	 * Given an HTML element, returns all components attached to it
	 * @param {Element} element
	 * @return {*}
	 */
	public getComponentForElement(element: Element): AbstractComponent[] {
		if (this.elementToComponentRegister.has(element)) {
			return this.elementToComponentRegister.get(element);
		}
		return [];
	}
	/**
	 * @description
	 * Saves an Element, component pair into the registery
	 * @param {Element} element
	 * @param {AbstractComponent} component
	 * @return {*}
	 */
	public registerElement(element: Element, component: AbstractComponent): void {
		if (this.elementToComponentRegister.has(element)) {
			this.elementToComponentRegister.get(element).push(component);
			return;
		}
		this.elementToComponentRegister.set(element, [component]);
	}
};