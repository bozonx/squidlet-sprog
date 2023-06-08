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
export declare function checkValueBeforeSet(isInitialized: boolean, definition: SuperItemDefinition | undefined, key: string, value?: AllTypes, ignoreRo?: boolean): void;
/**
 * Wrapper for SuperStruct which allows to manipulate it as common object.
 * And it puts some methods to it:
 * * struct.$super - instance of SuperStruct
 * * struct... - see other methods in STRUCT_PUBLIC_MEMBERS
 */
export declare function proxifyStruct(struct: SuperStruct): ProxyfiedStruct;
export declare class SuperStruct<T = Record<string, AllTypes>> extends SuperValueBase<T> implements SuperStructPublic {
    readonly isStruct = true;
    readonly values: T;
    protected proxyFn: typeof proxifyStruct;
    private readonly definition;
    get ownKeys(): string[];
    constructor(definition: Record<keyof T, SuperItemInitDefinition>, defaultRo?: boolean);
    /**
     * Init with initial values.
     * It returns setter for readonly params
     */
    init: (initialValues?: T) => (name: keyof T, newValue: AllTypes) => void;
    destroy: () => void;
    isKeyReadonly(key: string | number): boolean;
    getOwnValue(key: string): AllTypes;
    setOwnValue(keyStr: string, value: AllTypes, ignoreRo?: boolean): boolean;
    /**
     * Set default value or null if the key doesn't have a default value
     * @param key
     */
    toDefaultValue: (key: string) => void;
    getProxy(): T & ProxyfiedStruct<T>;
    batchSet(values?: T): void;
    validateItem(name: keyof T, value?: AllTypes, ignoreRo?: boolean): void;
    getDefinition(keyStr: string): SuperItemDefinition | undefined;
    /**
     * Set value of self readonly value and rise an event
     */
    protected myRoSetter: (name: keyof T, newValue: AllTypes) => void;
}
