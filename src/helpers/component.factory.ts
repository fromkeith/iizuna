import {HtmlElementUtility} from "./html-element-utility";
import {OnReady} from "../interfaces/on-ready.interface";
import {ComponentRegistry} from "./component.registry";
import {Template} from "../classes/template";
import {DomReady} from "./dom-ready";
import {AbstractComponent} from "../classes/abstract.component";
import {Promise} from "es6-promise";
import {OnResize} from "../interfaces/on-resize.interface";
import {TemplateCache} from "./template.cache";

/**
 * @description
 * The component Factory is used to bootstrap all Components.
 * Components can also be created on runtime with this factory
 */
export abstract class ComponentFactory {

	/**
	 * @description
	 * Registers all Components passed as array for the optioanlly passed element. If a component was already registered for the element, skip it. The Class should be passed, not the object!
	 * @param {*[]} components
	 * @param element
	 */
	public static registerComponentsOnce(components: any[], element: any = document): void {
		// register the classes so we can dynamically create new instances as needed
		for (const c of components) {
			const componentClass = this.createComponentClass(c);
			ComponentRegistry.componentDefinitions.set(componentClass.selector, c);
		}
		DomReady.ready(() => {
			for (let i = 0, l = components.length; i < l; i++) {
				const componentClass = this.createComponentClass(components[i]);
				const elements = HtmlElementUtility.querySelectAllByAttribute(componentClass.__options.selector, element);
				const alreadyRegisterdComponents = ComponentRegistry.getComponentsBySelector(componentClass.__options.selector);
				componentLoop: for (let j = 0, m = elements.length; j < m; j++) {
					for (let k = 0; k < alreadyRegisterdComponents.length; k++) {
						if (alreadyRegisterdComponents[k].element === elements[j]) {
							continue componentLoop;
						}
					}

					this.checkElementRestriction(elements[j] as HTMLElement, componentClass.__options.restrict);
					this.initializeComponentStepA(this.createComponentClass(components[i]), elements[j]);
				}
			}
		});
	}

	/**
	 * @description
	 * Registers all Components passed as array. The Class should be passed, not the object!
	 * @param {*[]} components
	 * @param element
	 */
	public static registerComponents(components: any[], element: any = document): void {
		// register the classes so we can dynamically create new instances as needed
		for (const c of components) {
			const componentClass = this.createComponentClass(c);
			ComponentRegistry.componentDefinitions.set(componentClass.selector, c);
		}
		DomReady.ready(() => {
			for (let i = 0, l = components.length; i < l; i++) {
				const componentClass = this.createComponentClass(components[i]);
				const elements = HtmlElementUtility.querySelectAllByAttribute(componentClass.__options.selector, element);
				for (let j = 0, m = elements.length; j < m; j++) {
					this.checkElementRestriction(elements[j] as HTMLElement, componentClass.__options.restrict);
					this.initializeComponentStepA(this.createComponentClass(components[i]), elements[j]);
				}
			}
		});
	}

	/**
	 * @description
	 * Checks for wrong usage of components (e.g. a component that reads the value of an input placed on a select)
	 * @param {HTMLElement} element
	 * @param {string} restrict
	 */
	private static checkElementRestriction(element: HTMLElement, restrict: string | undefined): void {
		if (typeof restrict !== 'string') {
			return;
		}
		if (!element.matches(restrict)) {
			console.warn(`Restriction ("${restrict}") for`, element, `was ignored! This could lead to unwanted behavior!`);
		}
	}

	/**
	 * @description
	 * You can register a listener, which gets called if the passed component gets initialized.
	 * Normally used by Decorators to add features to components
	 * @param callback
	 * @param individualComponent
	 */
	public static onComponentClassInitialized(callback: (componentObject?: AbstractComponent) => void, individualComponent: AbstractComponent): void {
		if (typeof individualComponent.__componentClassInitializedListeners === 'undefined') {
			individualComponent.__componentClassInitializedListeners = [];
		}
		individualComponent.__componentClassInitializedListeners.push(callback);
	}

	/**
	 * @description
	 * Calls the initialize listener of the passed component object (like the name says)
	 * @param {AbstractComponent} individualComponent
	 */
	private static callComponentClassInitialized(individualComponent: AbstractComponent): void {
		if (typeof individualComponent.__componentClassInitializedListeners === 'undefined') {
			return;
		}
		for (let i = 0, l = individualComponent.__componentClassInitializedListeners.length; i < l; i++) {
			individualComponent.__componentClassInitializedListeners[i](individualComponent);
		}
	}

	/**
	 * @description
	 * Returns an instance of the passed component class which is then being casted to the AbstractComponent for internal reasons.
	 * @param componentClass
	 * @return {AbstractComponent}
	 */
	private static createComponentClass(componentClass: any): AbstractComponent {
		return new componentClass() as AbstractComponent;
	}

	/**
	 * @description
	 * This method does the main work of component creation.
	 * it ...
	 * - ... searches for a matching template
	 * - ... initializes all children
	 * - ... calls all initialize listeners
	 * - ... calls all ready listeners
	 * - and registers the component object in the registry
	 * @param {AbstractComponent} individualComponent
	 * @param {HTMLElement} element
	 */
	private static initializeComponentStepA(individualComponent: AbstractComponent, element: Element): AbstractComponent {

		// dont re-create or re-register something that exists already
		const previous = ComponentRegistry.getComponentForElement(element);
		if (previous.length > 0) {
			for (const c of previous) {
				if (c.selector === individualComponent.selector && c.identifier === individualComponent.identifier) {
					return c;
				}
			}
		}

		ComponentRegistry.registerElement(element, individualComponent);

		individualComponent.element = element;
		individualComponent.selector = individualComponent.__options.selector;
		let tmplAttr = HtmlElementUtility.getSelectorValue('template-source', element);
		if (typeof tmplAttr === 'string' && tmplAttr !== '') {
			individualComponent.__options.templateUrl = tmplAttr;
		}
		if (individualComponent.__options.templateUrl) {
			let cachedTemplate = TemplateCache.get(individualComponent.__options.templateUrl);
			if (individualComponent.__options.templateCachingEnabled === true && cachedTemplate !== null) {
				individualComponent.template = new Template(cachedTemplate);
				this.initializeComponentStepB(individualComponent);
			} else {
				this.getRequest(individualComponent.__options.templateUrl).then((res: XMLHttpRequest) => {
					individualComponent.template = new Template(res.responseText);
					if (individualComponent.__options.templateCachingEnabled === true) {
						TemplateCache.set(individualComponent.__options.templateUrl, res.responseText);
					}
					this.initializeComponentStepB(individualComponent);
				});
			}
		} else {
			this.initializeComponentStepB(individualComponent);
		}

		return individualComponent;
	}

	/**
	 * @description
	 * Making getRequest
	 * @param url
	 * @todo: we should look for a better solution :/
	 */
	private static getRequest(url: string): Promise<XMLHttpRequest> {
		return new Promise((succ, err) => {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url);
			xhr.onload = function () {
				if (xhr.status === 200) {
					succ(xhr);
				} else {
					err(xhr.status);
				}
			};
			xhr.send();
		});
	}

	private static initializeComponentStepB(individualComponent: AbstractComponent) {
		let templateElement;
		if (typeof individualComponent.__options.template === 'string') {
			templateElement = document.getElementById(individualComponent.__options.template) as HTMLTemplateElement;
		} else if (!individualComponent.__options.templateUrl) {
			templateElement = individualComponent.element.getElementsByTagName('template')[0] as HTMLTemplateElement;
		}
		this.initializeTemplate(individualComponent, templateElement);

		let children: AbstractComponent[];
		if (individualComponent.__options.childrenSelectors && individualComponent.__options.childrenSelectors.length) {
			children = this.initializeChildrenElements(individualComponent, individualComponent.__options);
		}
		this.callComponentClassInitialized(individualComponent);
		this.callReadyListener(individualComponent);
		this.attachResizeListeners(individualComponent);
		if (individualComponent.__options.selector) {
			ComponentRegistry.registerComponent(individualComponent.__options.selector, individualComponent);
		}
	}

	/**
	 * @description
	 * Checks whether the passed templateElement contains html or not.
	 * If it does, then create a Template Object containing this html
	 * @param individualComponent
	 * @param {HTMLTemplateElement} templateElement
	 */
	private static initializeTemplate(individualComponent: AbstractComponent, templateElement: HTMLTemplateElement) {
		if (templateElement && typeof templateElement.innerHTML !== 'undefined') {//we no longer check the instance of, because of some polyfills that cant inherit from the HTMLTemplateElement
			individualComponent.template = new Template(templateElement.innerHTML);
			// TODO: huge breaking change.
			const html = individualComponent.template.render({});
			individualComponent.element.innerHTML = html;
		}
	}

	/**
	 * @description
	 * You can create component objects on the fly with this method.
	 * Lets say you have an HTML response of any given ajax request and you want to bootstrap the components defined there.
	 * Just call this method with a: the HTML element of the selector and b: the correct component class.
	 * @param {HTMLElement} element
	 * @param componentClass
	 */
	public static createComponentWithElement(element: HTMLElement, componentClass: AbstractComponent): AbstractComponent {
		return this.initializeComponentStepA(this.createComponentClass(componentClass), element);
	}

	/**
	 * @description
	 * Searches for children registered via Component Decorator
	 * @param {AbstractComponent} individualComponent
	 * @param options todo: add definition for options
	 */
	private static initializeChildrenElements(individualComponent: AbstractComponent, options: any): AbstractComponent[] {

		const foundChildren: AbstractComponent[] = [];
		for (let j = 0; j < options.childrenSelectors.length; j++) {
			let selector = options.childrenSelectors[j];
			let identifier: string = null;
			if (selector.indexOf('=')) {
				[selector, identifier] = selector.split('=');
			}
			const childrenElements = HtmlElementUtility.querySelectAllByAttribute(selector, individualComponent.element, identifier);
			if (typeof individualComponent.children === "undefined") {
				individualComponent.children = {};
				individualComponent.childrenComponents = {};
			}
			// this child selector... is it a registered component?
			// if so, lets makes sure it gets initialized
			const childCompentDef = ComponentRegistry.componentDefinitions.get(selector);
			const childrenComponents = [];
			if (childCompentDef) {
				// loop of each matching element we found
				const children = Array.from(childrenElements);
				for (const c of children) {
					// check if we have already created this child or not
					const childComp = ComponentRegistry.getComponentForElement(c);
					let foundChild: AbstractComponent;
					if (childComp.length > 0) {
						for (const cc of childComp) {
							// match first the selector. and then the identifier if one is set
							if (cc.selector === options.childrenSelectors[j] && (identifier === null || identifier === cc.identifier)) {
								foundChild = cc;
							}
						}
					}
					// if we couldn't find an instance of for this element and component
					// then lets init it!
					if (!foundChild) {
						foundChild = this.createComponentWithElement(c as HTMLElement, this.createComponentClass(childCompentDef));
					}
					foundChildren.push(foundChild);
					childrenComponents.push(foundChild);
				}
			}
			individualComponent.children[options.childrenSelectors[j]] = childrenElements;
			individualComponent.childrenComponents[options.childrenSelectors[j]] = childrenComponents;
		}
		return foundChildren;
	}

	/**
	 * @description
	 * Calls the onReady listener if the class of the component object implemented the OnReady Interface
	 * @param {AbstractComponent} individualComponent
	 */
	private static callReadyListener(individualComponent: AbstractComponent): void {
		let onReadyCasted = individualComponent as {} as OnReady;
		if ('onReady' in individualComponent && typeof onReadyCasted.onReady === 'function') {
			onReadyCasted.onReady();
		}
	}

	/**
	 * @description
	 * Adds support for the Resize listener.
	 * @param {AbstractComponent} individualComponent
	 */
	private static attachResizeListeners(individualComponent: AbstractComponent): void {
		let onResizeCasted = individualComponent as {} as OnResize;
		if ('onResize' in individualComponent && typeof onResizeCasted.onResize === 'function') {
			window.addEventListener('resize', () => {
				onResizeCasted.onResize();
			});
		}
	}
}