import {
  DEFAULT_INIT_SUPER_DEFINITION,
  SuperItemDefinition,
  SuperItemInitDefinition
} from '../types/SuperItemDefinition.js';
import {
  All_TYPES,
  AllTypes,
  SIMPLE_TYPES,
  SimpleType,
  SUPER_TYPES,
  SUPER_VALUES
} from '../types/valueTypes.js';
import {isCorrespondingType} from './isCorrespondingType.js';
import {resolveInitialSimpleValue} from './resolveInitialSimpleValue.js';


export const SUPER_VALUE_PROP = '$super'


export function isSuperValue(val: any): boolean {
  return typeof val === 'object' && val.isSuperValue
}

export function prepareDefinitionItem(
  definition: SuperItemInitDefinition,
  defaultRo: boolean = false
): SuperItemDefinition {
  return {
    ...DEFAULT_INIT_SUPER_DEFINITION,
    ...definition,
    readonly: (defaultRo)
      // if ro was set to false in definition then leave false. In other cases true
      ? definition.readonly !== false
      // or just use that value which is was set in definition
      : Boolean(definition.readonly),
  }
}

export function checkDefinition(definition: SuperItemInitDefinition) {
  const {
    type,
    required,
    nullable,
    readonly,
    default: defaultValue,
  } = definition

  if (type && !Object.keys(All_TYPES).includes(type)) {
    throw new Error(`Wrong type : ${type}`)
  }
  else if (typeof required !== 'undefined' && typeof required !== 'boolean') {
    throw new Error(`required has to be boolean`)
  }
  else if (typeof nullable !== 'undefined' && typeof nullable !== 'boolean') {
    throw new Error(`nullable has to be boolean`)
  }
  else if (typeof readonly !== 'undefined' && typeof readonly !== 'boolean') {
    throw new Error(`readonly has to be boolean`)
  }
  else if (defaultValue && !isCorrespondingType(defaultValue, type, nullable)) {
    throw new Error(
      `Default value ${defaultValue} doesn't meet type: ${type}`
    )
  }
}

/**
 * Resolves value for simple type and
 * any, simple function, super function, classes and other.
 * It assumes that you validated value before
 */
export function resolveNotSuperChild(
  definition: SuperItemDefinition,
  initialValue?: any
): SimpleType | undefined {
  // use initial value or default if no initial value
  const value = (typeof initialValue === 'undefined')
    ? definition.default
    : initialValue

  if (typeof value !== 'undefined') return value
  else if (Object.keys(SIMPLE_TYPES).includes(definition.type)) {
    // if no value then make it from simple type
    // return null if nullable or initial value for each type
    // e.g string='', number=0, boolean=false etc
    return resolveInitialSimpleValue(
      definition.type as keyof typeof SIMPLE_TYPES,
      definition.nullable
    )
  }
  else if (Object.keys(All_TYPES).includes(definition.type)) {
    // if no value or default value then return undefined for
    // any, simple function, super function, classes and other.
    return undefined
  }

  throw new Error(`Unsupported definition type of ${definition.type}`)
}

// TODO: почему только в struct а не в data??
export function validateChildValue(
  definition: SuperItemDefinition | undefined,
  childKeyOrIndex: string | number,
  value?: any
) {
  if (!definition) throw new Error(`no definition`)

  else if (definition.type === 'any') {
    return
  }
  else if (Object.keys(SUPER_VALUES).includes(definition.type)) {

    // TODO: validate super value
  }
  else if (definition.type === SUPER_TYPES.SuperFunc) {
    // TODO: validate super func
  }
  else if (Object.keys(SIMPLE_TYPES).includes(definition.type)) {
    if (typeof value === 'undefined' && definition.required) {
      throw new Error(`The value of ${childKeyOrIndex} is required, but hasn't defined`)
    }
    else if (typeof value === 'undefined' && !definition.required) {
      return
    }
    else if (!isCorrespondingType(value, definition.type, definition.nullable)) {
      throw new Error(
        `The value of ${childKeyOrIndex} has type ${typeof value}, `
        + `but not ${definition.type}`
      )
    }
    // // Value is defined in this case don't check required.
    // // Check type
    // else if (!isCorrespondingType(value, definition.type, definition.nullable)) {
    //   throw new Error(
    //     `The value of ${childKeyOrIndex} has type ${typeof value}, `
    //     + `but not ${definition.type}`
    //   )
    // }

  }
  // TODO: check other types
}

export function checkValueBeforeSet(
  isInitialized: boolean,
  definition: SuperItemDefinition | undefined,
  key: string | number,
  value?: AllTypes,
  ignoreRo?: boolean
) {
  if (!isInitialized) throw new Error(`Init it first`)
  else if (!definition) throw new Error(`Doesn't have definition for key ${key}`)
  // obviously check it otherwise it will be set to default
  else if (typeof value === 'undefined') {
    throw new Error(`It isn't possible to set undefined to data child`)
  }
  else if (!ignoreRo && definition.readonly) {
    throw new Error(`Can't set readonly value of name ${key}`)
  }
}

