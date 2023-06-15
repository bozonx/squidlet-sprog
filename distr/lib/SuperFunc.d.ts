import { SuperScope } from './scope.js';
import { SprogDefinition } from '../types/types.js';
import { RedefineDefinition, SuperItemDefinition, SuperItemInitDefinition } from '../types/SuperItemDefinition.js';
import { SuperBase } from './SuperBase.js';
import { ProxyfiedStruct } from './SuperStruct.js';
import { AllTypes } from '../types/valueTypes.js';
export declare const SUPER_RETURN = "superReturn";
export interface SuperFuncDefinition {
    props: Record<string, SuperItemDefinition>;
    lines: SprogDefinition[];
    redefine?: Record<string, RedefineDefinition>;
}
export declare function proxifySuperFunc(obj: any): (() => any);
export declare class SuperFunc<T = Record<string, AllTypes>> extends SuperBase {
    readonly isSuperFunc: boolean;
    readonly lines: SprogDefinition[];
    appliedValues: Record<string, any>;
    protected proxyFn: (instance: any) => any;
    private readonly propsSetter;
    private readonly scope;
    get props(): ProxyfiedStruct;
    constructor(scope: SuperScope, props: Record<keyof T, SuperItemInitDefinition>, lines: SprogDefinition[], redefine?: Record<string, RedefineDefinition>);
    /**
     * Apply values of function's props to exec function later.
     * It replaces previously applied values
     */
    applyValues: (values: Record<string, any>) => void;
    exec: (values?: Record<string, any>) => Promise<any>;
    private validateProps;
}
