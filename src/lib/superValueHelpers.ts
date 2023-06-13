import {
  DEFAULT_INIT_SUPER_DEFINITION,
  SuperItemDefinition,
  SuperItemInitDefinition
} from '../types/SuperItemDefinition.js';
import {
  All_TYPES,
  AllTypes, ProxifiedSuperValue,
  SIMPLE_TYPES,
  SimpleType, SUPER_VALUES,
} from '../types/valueTypes.js';
import {isCorrespondingType} from './isCorrespondingType.js';
import {resolveInitialSimpleValue} from './resolveInitialSimpleValue.js';
import {SuperArrayDefinition} from './SuperArray.js';


export const SUPER_VALUE_PROP = '$super'


export function isSuperValue(val: any): boolean {
  return typeof val === 'object' && val.isSuperValue
}

export function isSuperKind(val: any): boolean {
  return typeof val === 'object' && val.isSuper
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

export function checkDefinition(definition?: SuperItemInitDefinition) {
  if (!definition) return

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

export function checkArrayDefinition(definition?: Partial<SuperArrayDefinition>) {
  if (!definition) return

  const {
    type,
    default: defaultValue,
    defaultArray,
    nullable,
  } = definition

  if (defaultArray) {
    if (!Array.isArray(defaultArray)) {
      throw new Error(`defaultArray has to be an array`)
    }
    else if (
      defaultArray.findIndex((el) => !isCorrespondingType(el, type, nullable)) >= 0
    ) {
      throw new Error(`wrong defaultArray`)
    }
  }

  checkDefinition(definition as SuperItemInitDefinition)
}

export function validateChildValue(
  definition: SuperItemDefinition | undefined,
  childKeyOrIndex: string | number,
  value?: any
) {
  if (!definition) throw new Error(`no definition`)
  // if type any - nothing to check
  else if (definition.type === 'any') return
  else if (typeof value === 'undefined' && definition.required) {
    throw new Error(`The value of ${childKeyOrIndex} is required, but hasn't defined`)
  }
  // nothing to check
  else if (typeof value === 'undefined' && !definition.required) return
  else if (!Object.keys(All_TYPES).includes(definition.type)) {
    throw new Error(`Unknown type: ${definition.type}`)
  }
  else if (!isCorrespondingType(value, definition.type, definition.nullable)) {
    throw new Error(
      `The value of ${childKeyOrIndex} has type ${typeof value}, `
      + `but not ${definition.type}`
    )
  }
  // else it is ok
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

export function makeNewSuperValueByDefinition(
  definition: SuperItemDefinition,
  childKeyOrIndex: string | number
) {
  const superChildType = definition.type as keyof typeof SUPER_VALUES
  // it doesn't need to set whole RO because it will be set in $$setParent() in setupSuperChild()
  const superChildRo = definition.readonly
  let superChild
  // no initialValue
  if (definition.default) {
    //instantiateSuperValue()
    // there is has to be a defintion setup of child

    // TODO: циклическая зависимость !!!
    // superChild = new SUPER_VALUE_CLASSES[superChildType](
    //   // use default as definition of this value
    //   definition.default,
    //   superChildRo
    // )
  }
  else {
    // if no definition setup of child then just make it without definition
    // only for SuperData and SuperArray
    if (definition.type === SUPER_VALUES.SuperStruct) {
      throw new Error(`Can't create SuperStruct instance without definition for "${childKeyOrIndex}"`)
    }
    // make super child without definition
    // superChild = new SUPER_VALUE_CLASSES[superChildType](
    //   undefined,
    //   superChildRo
    // )
  }

  throw new Error(`Making super values from definition isn't supported at the moment`)

  // this.setupSuperChild(superChild, childKeyOrIndex)
  //
  // superChild.init()
  //
  // return superChild.getProxy()
}
