import { PRIMITIVE_TYPES, SIMPLE_TYPES, SUPER_TYPES } from '../types/valueTypes.js';
import { SUPER_VALUE_PROP } from './superValueHelpers.js';
/**
 * If undefined then it will be true.
 * @param value
 * @param type
 * @param nullable
 */
export function isCorrespondingType(value, type, nullable = false) {
    if (type === 'null')
        return value === null;
    else if (value === null)
        return nullable;
    else if (!type || type === 'any')
        return true;
    else if (value === null)
        return type === PRIMITIVE_TYPES.null;
    else if (type === SUPER_TYPES.SuperFunc) {
        if (typeof value !== 'function')
            return false;
        return Boolean(value[SUPER_VALUE_PROP].isSuperFunc);
    }
    // For super values and super func
    else if (Object.keys(SUPER_TYPES).includes(type)) {
        if (typeof value !== 'object' || !value[SUPER_VALUE_PROP])
            return false;
        return value[SUPER_VALUE_PROP].constructor?.name === type;
    }
    else if (Array.isArray(value))
        return type === SIMPLE_TYPES.array;
    // for Promise
    else if (typeof value === 'object' && type !== SIMPLE_TYPES.object) {
        return value.constructor?.name === type;
    }
    return typeof value === type;
}
