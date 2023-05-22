import {SuperStruct} from './SuperStruct.js';
import {SuperArray} from './SuperArray.js';
import {SuperPromise} from './SuperPromise.js';
import {SuperFunc} from './SuperFunc.js';


export type PrimitiveType = string | number | boolean | null
export type SimpleObject = Record<string, AllTypes>
export type SimpleArray = AllTypes[]
export type SimpleType = PrimitiveType | SimpleArray | Record<string, any>

export type SuperTypes = SuperStruct
  | SuperArray
  | SuperPromise
  | SuperFunc
export type AllTypes = SimpleType | SuperTypes

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
export const SUPER_TYPES = {
  SuperStruct: 'SuperStruct',
  SuperArray: 'SuperArray',
  SuperPromise: 'SuperPromise',
  SuperFunc: 'SuperFunc',
}
export const All_TYPES = {
  ...SIMPLE_TYPES,
  ...SUPER_TYPES,
  any: 'any',
  Promise: 'Promise',
}
