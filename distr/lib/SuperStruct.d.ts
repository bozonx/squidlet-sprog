import { SuperValueBase, SuperValuePublic } from './SuperValueBase.js';
import { SuperItemDefinition, SuperItemInitDefinition } from '../types/SuperItemDefinition.js';
import { AllTypes } from '../types/valueTypes.js';
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
 * * struct.$super - instance of SuperStruct
 * * struct... - see other methods in STRUCT_PUBLIC_MEMBERS
 */
export declare function proxifyStruct(struct: SuperStruct): ProxyfiedStruct;
/**
 * SuperStruct.
 * * It is allowed to make en empty struct, but it is useless
 * * It isn't possible to remove items from struct, but it is possible to set null
 */
export declare class SuperStruct<T = Record<string, AllTypes>> extends SuperValueBase<T> implements SuperStructPublic {
    readonly isStruct = true;
    readonly values: T;
    protected proxyFn: typeof proxifyStruct;
    private readonly definition;
    get allKeys(): string[];
    constructor(definition: Record<keyof T, SuperItemInitDefinition>, defaultRo?: boolean);
    /**
     * Init with initial values.
     * It returns setter for readonly params
     */
    init: (initialValues?: T) => (name: keyof T, newValue: AllTypes) => void;
    destroy: () => void;
    getProxy(): T & ProxyfiedStruct<T>;
    getDefinition(keyStr: string): SuperItemDefinition | undefined;
    /**
     * Set value of self readonly value and rise an event
     */
    protected myRoSetter: (name: keyof T, newValue: AllTypes) => void;
}
