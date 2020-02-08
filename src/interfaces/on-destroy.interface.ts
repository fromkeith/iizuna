/**
 * @description
 * This interface needs to be implemented to allow every individual-component to listen for when it is being removed from the DOM
 */
export interface OnDestroy {
    /**
     * @description
     * This method is called when this element is removed from the DOM
     */
    onDestroy(): void;
}