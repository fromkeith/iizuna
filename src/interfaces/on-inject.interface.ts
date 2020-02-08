/**
 * @description
 * This interface needs to be implemented to allow every individual-component to listen for basic service injection
 */
export interface OnInject {
    /**
     * @description
     * This method is called when items will be injected
     */
    onInject(...args: unknown[]): void;
}