import {All_TYPES} from '../types/valueTypes.js';


export function isCorrespondingType(value: any, type?: keyof typeof All_TYPES): boolean {
  if (!type || type === 'any') return true
  else if (value === null) return type === 'null'
  else if (Array.isArray(value)) return type === 'array'
  else if (typeof value === 'object' && type !== 'object') {
    return value?.constructor?.name === type
  }

  return typeof value === type
}
