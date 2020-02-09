import {ComponentFactory} from './component.factory';

export type UrlChanged = (lastPath: string, newPath: string, args: IPathArgs) => void;

export interface IPathArgs {
    [key: string]: string;
}

export interface IInjectionSpot {
    parentSelector: string;
    template: string;
    manualInject: (parent: HTMLElement, me: HTMLElement, args: IPathArgs) => void;
}

export interface ITemplateInjectionRules {
    path: string;
    onEnter?: UrlChanged;
    spots: IInjectionSpot[];
}

interface IInternalRules {
    reg: RegExp;
    args: string[];
    base: ITemplateInjectionRules;
}
interface IActiveRule {
    path: string;
    args: IPathArgs;
    base: ITemplateInjectionRules;
}

class RouteFactory {

    private active: IActiveRule = null;
    private paths: IInternalRules[] = [];

    public listenToHistory() {
        // TODO:
        /*
        var pushState = history.pushState;
        history.pushState = function () {
            pushState.apply(history, arguments);
            console.log('state changed!', arguments);
        };
        */
    }
    public getActiveRule(): IActiveRule {
        return this.active;
    }

    public urlChanged() {
        const newPath = window.location.pathname;
        if (this.active !== null && this.active.path === newPath) {
            return;
        }
        for (const p of this.paths) {
            if (!p.reg.test(newPath)) {
                continue;
            }
            const matches = newPath.match(p.reg);
            const outArgs: IPathArgs = {};
            const args = p.args;
            for (let i = 1; i < matches.length; i++) {
                outArgs[args[i - 1]] = matches[i];
            }
            const lastPath = this.active ? this.active.path : '';
            this.active = {
                path: newPath,
                args: outArgs,
                base: p.base,
            };
            if (p.base.onEnter) {
                p.base.onEnter(lastPath, newPath, outArgs);
            }
            return;
        }
        this.active = null;
    }

    public addRoute(rule: ITemplateInjectionRules) {
        let asRegex = rule.path;
        let args: string[] = [];
        for (;;) {
            let before = asRegex;
            asRegex = asRegex.replace(/\{\w+\}/, (match) => {
                args.push(match.substr(1, match.length - 2));
                return '(\\w+)';
            });
            if (before === asRegex) {
                break;
            }
        }
        const reg = new RegExp(asRegex);
        this.paths.push({
            reg,
            args,
            base: rule,
        });
    }

}

export const router = new RouteFactory();