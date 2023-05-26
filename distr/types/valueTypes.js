export const PRIMITIVE_TYPES = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    null: 'null',
};
export const SIMPLE_TYPES = {
    ...PRIMITIVE_TYPES,
    array: 'array',
    object: 'object',
};
export const SUPER_TYPES = {
    SuperStruct: 'SuperStruct',
    SuperArray: 'SuperArray',
    SuperPromise: 'SuperPromise',
    SuperFunc: 'SuperFunc',
};
export const All_TYPES = {
    ...SIMPLE_TYPES,
    ...SUPER_TYPES,
    any: 'any',
    Promise: 'Promise',
};
