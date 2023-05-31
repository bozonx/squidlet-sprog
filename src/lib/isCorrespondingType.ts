import {All_TYPES, PRIMITIVE_TYPES, SIMPLE_TYPES} from '../types/valueTypes.js';


export function isCorrespondingType(value: any, type?: keyof typeof All_TYPES): boolean {
  if (!type || type === 'any') return true
  else if (value === null) return type === PRIMITIVE_TYPES.null
  else if (Array.isArray(value)) return type === SIMPLE_TYPES.array
  else if (typeof value === 'object' && type !== SIMPLE_TYPES.object) {
    return value?.constructor?.name === type
  }

  return typeof value === type
}
