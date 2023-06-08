import {SuperScope} from './scope.js';
import {AllTypes, SIMPLE_TYPES, SUPER_TYPES, SUPER_VALUES} from '../types/valueTypes.js';
import {
  SuperValueBase,
  isSuperValue,
  SUPER_VALUE_PROP,
  SUPER_PROXY_PUBLIC_MEMBERS,
  SuperValuePublic, checkDefinition, prepareDefinitionItem, SUPER_VALUE_EVENTS, validateChildValue
} from './SuperValueBase.js';
import {
  SuperItemDefinition,
  SuperItemInitDefinition
} from '../types/SuperItemDefinition.js';
import {resolveInitialSimpleValue} from './helpers.js';
import {isCorrespondingType} from './isCorrespondingType.js';
import {proxifyLayeredValue} from './SuperData.js';



// TODO: наверное в default запретить пока super value


export interface SuperStructPublic extends SuperValuePublic {
  isStruct: boolean
}

export type ProxyfiedStruct<T = Record<any, any>> = SuperStructPublic
  & {$super: SuperStruct}
  & T


export const STRUCT_PUBLIC_MEMBERS = [
  ...SUPER_PROXY_PUBLIC_MEMBERS,
  'isStruct',
]

export function checkValueBeforeSet(
  isInitialized: boolean,
  definition: SuperItemDefinition | undefined,
  key: string,
  value?: AllTypes,
  ignoreRo: boolean = false
) {
  if (!isInitialized) throw new Error(`Init it first`)
  else if (!definition) throw new Error(`Doesn't have key ${key}`)
  // obviously check it otherwise it will be set to default
  else if (typeof value === 'undefined') {
    throw new Error(`It isn't possible to set undefined to data child`)
  }
  else if (!ignoreRo && definition.readonly) {
    throw new Error(`Can't set readonly value of name ${key}`)
  }
}


/**
 * Wrapper for SuperStruct which allows to manipulate it as common object.
 * And it puts some methods to it:
 * * struct.$super - instance of SuperStruct
 * * struct... - see other methods in STRUCT_PUBLIC_MEMBERS
 */
export function proxyStruct(struct: SuperStruct): ProxyfiedStruct {
  const handler: ProxyHandler<Record<any, any>> = {
    get(target: any, prop: string) {
      if (prop === SUPER_VALUE_PROP) {
        return struct
      }
      else if (STRUCT_PUBLIC_MEMBERS.includes(prop)) {
        // public super struct prop
        return (struct as any)[prop]
      }
      // else prop or object itself
      return struct.layeredValues[prop]
    },

    has(target: any, prop: string): boolean {
      if (prop === SUPER_VALUE_PROP || STRUCT_PUBLIC_MEMBERS.includes(prop)) {
        return true
      }

      return struct.allKeys().includes(prop)
    },

    set(target: any, prop: string, newValue: any): boolean {
      struct.setOwnValue(prop, newValue)

      return true
    },

    deleteProperty(): boolean {
      throw new Error(`It isn't possible to delete struct value`)
    },

    ownKeys(): ArrayLike<string | symbol> {
      return struct.ownKeys
    },
  }

  return new Proxy(struct.ownValues, handler) as ProxyfiedStruct
}


export class SuperStruct<T = Record<string, AllTypes>>
  extends SuperValueBase<T>
  implements SuperStructPublic
{
  readonly isStruct = true
  // It assumes that you will not change it after initialization
  readonly definition: Record<keyof T, SuperItemDefinition> = {} as any
  // current values
  readonly ownValues = {} as T
  readonly layeredValues: T
  protected proxyFn = proxyStruct

  get ownKeys(): string[] {
    return Object.keys(this.ownValues as any)
  }


  constructor(
    definition: Record<keyof T, SuperItemInitDefinition>,
    defaultRo: boolean = false,
    lowLayer?: SuperStruct
  ) {
    if (lowLayer && !lowLayer.isStruct) {
      throw new Error(`Struct can inherit only other struct`)
    }

    super(lowLayer as SuperValueBase | undefined)

    this.layeredValues = proxifyLayeredValue(
      this.ownValues as any,
      lowLayer as SuperValueBase | undefined
    )

    for (const keyStr of Object.keys(definition)) {
      checkDefinition(definition[keyStr as keyof T])

      this.definition[keyStr as keyof T] = prepareDefinitionItem(
        definition[keyStr as keyof T],
        defaultRo
      )
    }
  }


  /**
   * Init with initial values.
   * It returns setter for readonly params
   */
  init = (initialValues?: T): ((name: keyof T, newValue: AllTypes) => void) => {
    if (this.inited) {
      throw new Error(`The struct has been already initialized`)
    }

    this.events.emit(SUPER_VALUE_EVENTS.initStart)

    // set initial values
    for (const keyStr of Object.keys(this.definition)) {
      const keyName = keyStr as keyof T

      this.ownValues[keyName] = this.setupChildValue(
        this.definition[keyName],
        keyStr,
        initialValues?.[keyName]
      )
    }

    return super.init()
  }

  destroy = () => {
    super.destroy()

    for (const key of this.ownKeys) {
      const keyName = key as keyof T

      if (typeof this.ownValues[keyName] === 'object' && (this.ownValues[keyName] as any).destroy) {
        // it will destroy itself and its children
        (this.ownValues[keyName] as SuperValueBase).destroy()
      }
    }
  }


  isKeyReadonly(key: string | number): boolean {
    if (!this.definition[key as keyof T]) {
      throw new Error(`Struct doesn't have key ${key}`)
    }

    return Boolean(this.definition?.[key as keyof T].readonly)
  }

  getOwnValue(key: string): AllTypes {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return this.ownValues[key as keyof T] as any
  }

  setOwnValue(keyStr: string, value: AllTypes, ignoreRo: boolean = false): boolean {
    const name: keyof T = keyStr as any

    this.validateItem(name, value, ignoreRo)

    this.ownValues[name] = this.setupChildValue(this.definition[name], keyStr, value)

    this.riseChildrenChangeEvent(keyStr)

    return true
  }

  /**
   * Set default value or null if the key doesn't have a default value
   * @param key
   */
  toDefaultValue = (key: string) => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (!this.definition[key as keyof T]) {
      throw new Error(`Struct doesn't have key ${key}`)
    }

    let defaultValue = this.definition[key as keyof T].default

    // TODO: а если super type??? То надо вызвать default value у него ???
    //       или ничего не делать? Если менять заного то надо дестроить предыдущий

    // if no default value then make it from type
    if (
      Object.keys(SIMPLE_TYPES).includes(this.definition[key as keyof T].type)
      && typeof defaultValue === 'undefined'
    ) {
      defaultValue = resolveInitialSimpleValue(
        this.definition[key as keyof T].type as keyof typeof SIMPLE_TYPES,
        this.definition[key as keyof T].nullable,
      )
    }

    this.setOwnValue(key, defaultValue)
  }

  getProxy(): T & ProxyfiedStruct<T> {
    return super.getProxy()
  }


  /////// Struct specific
  // TODO: test
  batchSet(values?: T) {
    if (!values) return

    for (const key of Object.keys(values)) {
      this.setOwnValue(key, (values as any)[key])
    }
  }

  // TODO: test
  validateItem(name: keyof T, value?: AllTypes, ignoreRo?: boolean) {
    const keyStr = name as string
    const definition = this.definition[name]

    checkValueBeforeSet(this.isInitialized, definition, keyStr, value, ignoreRo)

    validateChildValue(name as string, definition, value)
  }

  getDefinition(key: keyof T): SuperItemDefinition | undefined {
    if (this.definition[key]) {
      return this.definition[key]
    }
    else if (this.lowLayer) {
      return (this.lowLayer as any).getDefinition(key as string)
    }
  }


  /**
   * Set value of self readonly value and rise an event
   */
  protected myRoSetter = (name: keyof T, newValue: AllTypes) => {
    this.setOwnValue(name as any, newValue, true)
  }

}
