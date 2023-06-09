import { ProxyfiedStruct, SuperStruct } from '../lib/SuperStruct.js';
import { ProxyfiedArray, SuperArray } from '../lib/SuperArray.js';
import { SuperPromise } from '../lib/SuperPromise.js';
import { SuperFunc } from '../lib/SuperFunc.js';
import { ProxyfiedData, SuperData } from '../lib/SuperData.js';
export type ProxifiedSuperValue<T = any> = ProxyfiedData<T> | ProxyfiedArray<T> | ProxyfiedStruct<T>;
export type PrimitiveType = string | number | boolean | null;
export type SimpleObject = Record<string, AllTypes>;
export type SimpleArray = AllTypes[];
export type SimpleType = PrimitiveType | SimpleArray | Record<string, any>;
export type SuperValues = SuperStruct | SuperArray | SuperData;
export type SuperTypes = SuperValues | SuperPromise | SuperFunc;
export type AllTypes = SimpleType | SuperTypes | Promise<any>;
export declare const PRIMITIVE_TYPES: {
    string: string;
    number: string;
    boolean: string;
    null: string;
};
export declare const SIMPLE_TYPES: {
    array: string;
    object: string;
    string: string;
    number: string;
    boolean: string;
    null: string;
};
export declare const SUPER_VALUES: {
    SuperStruct: string;
    SuperArray: string;
    SuperData: string;
};
export declare const SUPER_TYPES: {
    SuperPromise: string;
    SuperFunc: string;
    SuperStruct: string;
    SuperArray: string;
    SuperData: string;
};
export declare const All_TYPES: {
    function: string;
    any: string;
    Promise: string;
    SuperPromise: string;
    SuperFunc: string;
    SuperStruct: string;
    SuperArray: string;
    SuperData: string;
    array: string;
    object: string;
    string: string;
    number: string;
    boolean: string;
    null: string;
};
