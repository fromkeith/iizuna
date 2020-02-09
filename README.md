## About
This is a fork of https://github.com/iizunats/iizuna/

* Focus of this library is to allow easy component injection to 3rd party websites. Eg. via chrome extensions
* Why use `iizuna`?
 * It provides a TypeScript first approach to components.
 * Its very light weight, and not over burdensome

### Breaking Changes

- Templates
	- [x] render child template immediately
	- [ ] remove mustache entirely
	- [ ] refine
	- [ ] unit tests
- LifeCycle
	- [x] allow components to be destroyed for when injecting into SPA
	- [ ] verify no memory leaks
	- [ ] refine
	- [ ] unit tests
- Extras
	- [x] allow very basic service injection
		- [ ] Refine to constructor?
	- [x] give components access to their child components
	- [ ] refine
	- [ ] unit tests
- "Routing"
	- [ ] react to SPA page changes
	- [x] allow very basic "routing".
	- [ ] have a more automated way of injecting components
	- [ ] refine
	- [ ] unit tests


## Routing

Routing is not so much "routing" as it is reacting to route changes. For now, you must trigger when a page is changed.
It will listen for any new HTML components being added to the DOM, and help inject your component


```TypeScript
import {
    router,
    IPathArgs,
} from 'iizuna';

router.addRoute({
	// what pathname we should activate on
    path: '/page/path/{someId}',
    spots: [
        {
        	// what parent we should look for
            parentSelector: '.some .selector-that[checked]',
            // what my template needs to be
            template: '<span hello-world></span>',
            // you MUST inject yourself where in the parent you want to go
            manualInject: (parent: HTMLElement, me: HTMLElement, args: IPathArgs) => {
            	// maybe pull info from the DOM?
                const someId = parent.getAttribute('data-item-id');
                me.setAttribute('hello-world', someId);
                me.setAttribute('some-id', args.someId);
                // put myself into the dom
                parent.prepend(me);
            },
        },
    ],
});
```


## Services

A service, is just any old Object or class that lives as a singleton.


```TypeScript
// my service definition
class MyService {

}
// register it to a service
ComponentFactory.registerServices([
    ['MyService', new MyService()]
]);
// have a component reference it
@Component({
    selector: 'hello-world',
    inject: ['MyService'],
});
export class HelloWorldComponent extends AbstractComponent implements OnInject, OnDestroy {
	onInject(myService: MyService) {
        this.myService = leadService;
    }
    onDestory() {
    	// remove any references to things
    }
}

```