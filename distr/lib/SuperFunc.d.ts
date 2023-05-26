import { AllTypes } from '../types/valueTypes.js';
import { SprogItemDefinition, SuperScope } from '../scope.js';
export interface SuperFuncProp {
    type: AllTypes;
    default?: any;
    required?: boolean;
}
export interface SuperFuncParams {
    props: Record<string, SuperFuncProp>;
    lines: SprogItemDefinition[];
}
export declare class SuperFunc {
    scope: SuperScope;
    private readonly props;
    private readonly lines;
    private appliedValues;
    get propsDefaults(): Record<any, any>;
    constructor(scope: SuperScope, { props, lines }: SuperFuncParams);
    replaceScope(newScope: SuperScope): void;
    /**
     * Apply values of function's props to exec function later.
     * It replaces previously applied values
     */
    applyValues(values: Record<string, any>): void;
    /**
     * Apply values of function's props to exec function later.
     * It merges new values with previously applied values
     */
    mergeValues(values: Record<string, any>): void;
    exec(values?: Record<string, any>): Promise<any>;
    /**
     * Make clone of function include applied props
     * but with the same scope
     */
    clone(newScope?: SuperScope, values?: Record<string, any>): () => any;
    private validateProps;
}
