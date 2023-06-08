import { SuperValueBase, SuperValuePublic } from './SuperValueBase.js';
import { AllTypes } from '../types/valueTypes.js';
import { SuperItemDefinition, SuperItemInitDefinition } from '../types/SuperItemDefinition.js';
export interface SuperDataPublic extends SuperValuePublic {
    isData: boolean;
}
export type ProxyfiedData<T = Record<any, any>> = SuperDataPublic & {
    $super: SuperData;
} & T;
export declare const DATA_MEMBERS: string[];
export declare const DEFAULT_DEFINITION_KEY = "$DEFAULT";
export declare function proxifyData(data: SuperData): ProxyfiedData;
export declare function proxifyLayeredValue(topOwnValues: Record<string, any>, bottomData?: SuperData): Record<any, any>;
export declare class SuperData<T extends Record<string, any> = Record<string, any>> extends SuperValueBase<Record<string | number, T>> implements SuperDataPublic {
    readonly isData = true;
    readonly ownValues: Record<string, any>;
    readonly values: Record<string, any>;
    readonly defaultRo: boolean;
    readonly bottomLayer?: SuperData;
    protected proxyFn: typeof proxifyData;
    private readonly ownOrderedKeys;
    private readonly definition;
    get defaultDefinition(): SuperItemDefinition | undefined;
    /**
     * Keys only of me, not low layer and not children's
     */
    get ownKeys(): string[];
    get allKeys(): (string | number)[];
    constructor(definition?: Record<string, SuperItemInitDefinition>, defaultRo?: boolean, bottomLayer?: SuperData);
    init: (initialValues?: T) => (name: keyof T, newValue: AllTypes) => void;
    destroy: () => void;
    $$setParent(parent: SuperValueBase, myPath: string): void;
    isKeyReadonly(key: string | number): boolean;
    getOwnValue(key: string): AllTypes;
    setOwnValue(key: string, value: AllTypes, ignoreRo?: boolean): boolean;
    /**
     * Set value deeply.
     * You can set own value or value of some deep object.
     * Even you can set value to the deepest primitive like: struct.struct.num = 5
     * @returns {boolean} if true then value was found and set. If false value hasn't been set
     */
    setValue: (pathTo: string, newValue: AllTypes) => boolean;
    /**
     * Set default value or null if the key doesn't have a default value
     * @param key
     */
    toDefaultValue: (key: string) => void;
    getProxy(): T & ProxyfiedData<T>;
    clone: () => T;
    batchSet(values?: Record<string, any>): void;
    /**
     * Set a new definition for a specific key. You can't replace or change it.
     */
    define(key: string, definition?: SuperItemInitDefinition, initialValue?: any): void;
    /**
     * Set default definition or remove it if null passed
     * @param definition
     */
    setDefaultDefinition(definition: SuperItemInitDefinition | null): void;
    getDefinition(key: string | number): SuperItemDefinition | undefined;
    /**
     * Remove value and definition in that way as they never exist.
     * It removes value and definition from bottom layer too.
     * @param key
     */
    forget(key: string): void;
    /**
     * Set value of self readonly value and rise an event
     */
    protected myRoSetter: (name: keyof T, newValue: AllTypes) => void;
    private makeOrderedObject;
}
