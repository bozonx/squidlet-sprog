import {SIMPLE_TYPES, SimpleType} from '../types/valueTypes.js';


const TYPE_INITIAL_VALUES: Record<keyof typeof SIMPLE_TYPES, SimpleType> = {
  string: '',
  number: 0,
  boolean: false,
  'null': null,
  array: [],
  object: {},
}

export function resolveInitialSimpleValue(
  type: keyof typeof SIMPLE_TYPES,
  nullable: boolean = false
): SimpleType {
  if (nullable) return null

  const res = TYPE_INITIAL_VALUES[type]

  if (typeof res === 'undefined') throw new Error(`Bad type ${type}`)

  return res
}
