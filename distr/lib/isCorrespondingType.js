import { PRIMITIVE_TYPES, SIMPLE_TYPES } from '../types/valueTypes.js';
export function isCorrespondingType(value, type, nullable = false) {
    if (value === null)
        return nullable;
    else if (!type || type === 'any')
        return true;
    else if (value === null)
        return type === PRIMITIVE_TYPES.null;
    else if (Array.isArray(value))
        return type === SIMPLE_TYPES.array;
    else if (typeof value === 'object' && type !== SIMPLE_TYPES.object) {
        return value?.constructor?.name === type;
    }
    return typeof value === type;
}
