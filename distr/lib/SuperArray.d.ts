import { SuperValueBase, SuperValuePublic } from './SuperValueBase.js';
import { AllTypes } from '../types/valueTypes.js';
import { SuperItemDefinition } from '../types/SuperItemDefinition.js';
export interface SuperArrayDefinition extends Omit<SuperItemDefinition, 'required'> {
    defaultArray?: any[];
}
export interface SuperArrayPublic extends SuperValuePublic {
    isArray: boolean;
    isReadOnly: boolean;
    length: number;
    clearItem(index: number): void;
    deleteItem(index: number, ignoreRo?: boolean): void;
    push(...items: any[]): number;
    pop(): any | undefined;
    shift(): any | undefined;
    unshift(...items: any[]): number;
    fill(value: any, start?: number, end?: number): ProxyfiedArray;
    splice(start: number, deleteCount: number, ...items: any[]): any[];
    reverse(): any[];
    sort(): ProxyfiedArray;
}
export type ProxyfiedArray<T = any> = SuperArrayPublic & {
    $super: SuperArray;
} & Array<T>;
/**
 * Wrapper for super array which allows to manipulate it as common array.
 * And it puts some methods to it:
 * * arr.$super - instance of SuperArray
 * * arr... - see other methods in ARR_PUBLIC_MEMBERS
 * @param arr
 */
export declare function proxifyArray(arr: SuperArray): ProxyfiedArray;
export declare class SuperArray<T = any> extends SuperValueBase<T[]> implements SuperArrayPublic {
    readonly isArray = true;
    readonly values: T[];
    protected proxyFn: typeof proxifyArray;
    private readonly definition;
    get isReadOnly(): boolean;
    get length(): number;
    get itemDefinition(): SuperItemDefinition;
    get ownKeys(): number[];
    constructor(definition: Partial<SuperArrayDefinition>);
    /**
     * Init with initial values.
     * It returns setter for readonly params
     */
    init: (initialArr?: T[]) => (index: number, item: AllTypes) => void;
    destroy: () => void;
    /**
     * Listen only to add, remove or reorder array changes
     */
    onArrayChange(handler: () => void): number;
    isKeyReadonly(key: string | number): boolean;
    getOwnValue(key: number): AllTypes;
    setOwnValue(key: string | number, value: AllTypes, ignoreRo?: boolean): boolean;
    /**
     * Set default value of array or undefined if there isn't any default value
     * @param index
     */
    toDefaultValue: (index: number) => void;
    getProxy(): ProxyfiedArray<T>;
    /**
     * Clear item in array but not remove index
     * clearItem(1) [0,1,2] will be [0, empty, 2]
     * getting of arr[1] will return undefined
     * @param index
     */
    clearItem: (index: number) => void;
    /**
     * Delete item and splice an array
     * deleteItem(1) [0,1,2] will be [0,2]
     * @param index
     * @param ignoreRo
     */
    deleteItem: (index: number, ignoreRo?: boolean) => void;
    getDefinition(index: number): SuperItemDefinition | undefined;
    push: (...items: any[]) => number;
    pop: () => T | undefined;
    shift: () => T | undefined;
    unshift: (...items: any[]) => number;
    fill: (value: any, start?: number, end?: number) => ProxyfiedArray;
    splice: (start: number, deleteCount: number, ...items: T[]) => T[];
    reverse: () => T[];
    sort: (compareFn?: ((a: T, b: T) => number) | undefined) => ProxyfiedArray;
    /**
     * Set value of self readonly value and rise an event
     */
    protected myRoSetter: (index: number, newValue: AllTypes) => void;
    private checkDefinition;
}
