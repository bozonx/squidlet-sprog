import { SuperStruct } from '../lib/SuperStruct.js';
import { SuperArray } from '../lib/SuperArray.js';
import { SuperPromise } from '../lib/SuperPromise.js';
import { SuperFunc } from '../lib/SuperFunc.js';
export type PrimitiveType = string | number | boolean | null;
export type SimpleObject = Record<string, AllTypes>;
export type SimpleArray = AllTypes[];
export type SimpleType = PrimitiveType | SimpleArray | Record<string, any>;
export type SuperTypes = SuperStruct | SuperArray | SuperPromise | SuperFunc;
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
export declare const SUPER_TYPES: {
    SuperStruct: string;
    SuperArray: string;
    SuperPromise: string;
    SuperFunc: string;
};
export declare const All_TYPES: {
    any: string;
    Promise: string;
    SuperStruct: string;
    SuperArray: string;
    SuperPromise: string;
    SuperFunc: string;
    array: string;
    object: string;
    string: string;
    number: string;
    boolean: string;
    null: string;
};
