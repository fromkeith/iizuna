export abstract class HtmlElementUtility {

    public static querySelectByAttribute(selector: string, element: any = document, value: string = null) {
        const queryValued = value !== null ? selector + '="' + value + '"' : selector;
        return element.querySelector('[data-' + queryValued + '],[' + queryValued + ']');
    }

    public static querySelectAllByAttribute(selector: string, element: any = document, value: string = null) {
        const queryValued = value !== null ? selector + '="' + value + '"' : selector;
        return element.querySelectorAll('[data-' + queryValued + '],[' + queryValued + ']');
    }

    public static getSelectorValue(selector: string, element: HTMLElement) {
        const clearedSelector = selector.replace(/^data-/, '');
        return element.getAttribute(clearedSelector) || element.getAttribute('data-' + clearedSelector);
    }
}