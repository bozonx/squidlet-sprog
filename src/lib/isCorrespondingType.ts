import {All_TYPES, PRIMITIVE_TYPES, SIMPLE_TYPES} from '../types/valueTypes.js';


/**
 * If undefined then it will be true.
 * @param value
 * @param type
 * @param nullable
 */
export function isCorrespondingType(
  value: any,
  type?: keyof typeof All_TYPES,
  nullable: boolean = false
): boolean {
  if (type === 'null') return value === null
  else if (value === null) return nullable
  else if (!type || type === 'any') return true
  else if (value === null) return type === PRIMITIVE_TYPES.null
  else if (Array.isArray(value)) return type === SIMPLE_TYPES.array
  else if (typeof value === 'object' && type !== SIMPLE_TYPES.object) {
    return value?.constructor?.name === type
  }

  return typeof value === type
}
