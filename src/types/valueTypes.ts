import {SuperStruct} from '../lib/SuperStruct.js';
import {SuperArray} from '../lib/SuperArray.js';
import {SuperPromise} from '../lib/SuperPromise.js';
import {SuperFunc} from '../lib/SuperFunc.js';


export type PrimitiveType = string | number | boolean | null
export type SimpleObject = Record<string, AllTypes>
export type SimpleArray = AllTypes[]
export type SimpleType = PrimitiveType | SimpleArray | Record<string, any>

export type SuperTypes = SuperStruct
  | SuperArray
  | SuperPromise
  | SuperFunc
export type AllTypes = SimpleType | SuperTypes | Promise<any>

export const PRIMITIVE_TYPES = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  null: 'null',
}
export const SIMPLE_TYPES = {
  ...PRIMITIVE_TYPES,
  array: 'array',
  object: 'object',
}
export const SUPER_VALUES = {
  SuperStruct: 'SuperStruct',
  SuperArray: 'SuperArray',
}
export const SUPER_TYPES = {
  ...SUPER_VALUES,
  SuperPromise: 'SuperPromise',
  SuperFunc: 'SuperFunc',
}
export const All_TYPES = {
  ...SIMPLE_TYPES,
  ...SUPER_TYPES,
  any: 'any',
  Promise: 'Promise',
}
