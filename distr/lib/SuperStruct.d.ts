import { SuperScope } from '../scope.js';
import { AllTypes } from '../types/valueTypes.js';
import { SuperValueBase, SuperValuePublic } from './SuperValueBase.js';
import { SuperItemDefinition, SuperItemInitDefinition } from '../types/SuperItemDefinition.js';
export interface SuperStructPublic extends SuperValuePublic {
    isStruct: boolean;
}
export type ProxyfiedStruct<T = Record<any, any>> = SuperStructPublic & {
    $super: SuperStruct;
} & T;
export declare const STRUCT_PUBLIC_MEMBERS: string[];
/**
 * Wrapper for SuperStruct which allows to manipulate it as common object.
 * And it puts some methods to it:
 * * arr.$super - instance of SuperStruct
 * * arr... - see other methods in STRUCT_PUBLIC_MEMBERS
 */
export declare function proxyStruct(struct: SuperStruct): ProxyfiedStruct;
export declare class SuperStruct<T = Record<string, AllTypes>> extends SuperValueBase<T> implements SuperStructPublic {
    readonly isStruct = true;
    readonly definition: Record<keyof T, SuperItemDefinition>;
    readonly values: T;
    protected proxyFn: typeof proxyStruct;
    constructor(scope: SuperScope, definition: Record<keyof T, SuperItemInitDefinition>, defaultRo?: boolean);
    /**
     * Init with initial values.
     * It returns setter for readonly params
     */
    init: (initialValues?: T) => (name: keyof T, newValue: AllTypes) => void;
    destroy: () => void;
    isKeyReadonly(key: string | number): boolean;
    myKeys(): string[];
    getOwnValue(key: string): AllTypes;
    setOwnValue(key: string, value: AllTypes, ignoreRo?: boolean): void;
    /**
     * Set default value or null if the key doesn't have a default value
     * @param key
     */
    toDefaultValue: (key: string) => void;
    getProxy(): T & ProxyfiedStruct<T>;
    /**
     * Set value of self readonly value and rise an event
     */
    protected myRoSetter: (name: keyof T, newValue: AllTypes) => void;
    private prepareDefinition;
}
