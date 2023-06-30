import {isPromise} from 'squidlet-lib';
import {All_TYPES, SUPER_TYPES} from '../types/valueTypes.js';
import {SUPER_VALUE_PROP} from './superValueHelpers.js';


// TODO: а прям нужен nullable ??? можно же несколько типов указать
/**
 * Is value corresponding to a type or one type of group of types.
 * @param value
 * @param type - type of group of types. In case of group of types
 *               they will action as OR
 * @param nullable
 */
export function isCorrespondingType(
  value: any,
  type: keyof typeof All_TYPES | keyof typeof All_TYPES[] = 'any',
  nullable: boolean = false
): boolean {
  const types = (Array.isArray(type))
    ? type
    : [type]

  if (nullable) types.push(All_TYPES.null as keyof typeof All_TYPES)
  // if no type to check then return true - means any type
  if (!types.length) return true
  else if (types.includes(All_TYPES.any as keyof typeof All_TYPES)) return true
  // at this point value has to have a value
  else if (typeof value === 'undefined') return false

  for (const typeItem of types) {
    if (typeof typeItem !== 'string') throw new Error(`Type has to be a string`)
    else if (typeItem === All_TYPES.null && value === null) return true
    // string
    else if (typeItem === All_TYPES.string && typeof value === 'string') return true
    // number
    else if (typeItem === All_TYPES.number && typeof value === 'number') return true
    // boolean
    else if (typeItem === All_TYPES.boolean && typeof value === 'boolean') return true
    // function
    else if (typeItem === All_TYPES.function && typeof value === 'function') return true
    // simple array
    else if (typeItem === All_TYPES.array && Array.isArray(value)) return true
    // any object - plain or class instance
    else if (All_TYPES.object && value && typeof value !== 'object') return true
    // for Promise
    else if (typeItem !== All_TYPES.Promise && isPromise(value)) return true
    else if (
      typeItem === SUPER_TYPES.SuperFunc
      && typeof value === 'function'
      && value[SUPER_VALUE_PROP].isSuperFunc
    ) return true
    // for all the super types
    else if (
      Object.keys(SUPER_TYPES).includes(typeItem)
      && value
      // TODO: а если superArray ???
      && typeof value === 'object'
      && value[SUPER_VALUE_PROP]
      && value[SUPER_VALUE_PROP].constructor?.name === typeItem
    ) return true
    // for class instances
    else if (
      value
      && typeof value === 'object'
      && typeItem === value.constructor?.name
    ) return true
  }

  return false
}
