import {arrayDifference, isPlainObject} from 'squidlet-lib';
import {
  SuperValueBase,
  SUPER_VALUE_PROXY_PUBLIC_MEMBERS,
  SuperValuePublic,
  SUPER_VALUE_EVENTS,
} from './SuperValueBase.js';
import {
  SuperItemDefinition,
  SuperItemInitDefinition
} from '../types/SuperItemDefinition.js';
import {
  checkDefinition,
  isSuperValue,
  prepareDefinitionItem,
  SUPER_VALUE_PROP,
} from './superValueHelpers.js';
import {AllTypes} from '../types/valueTypes.js';
import {SuperScope} from './scope.js';


export interface SuperStructPublic extends SuperValuePublic {
  isStruct: boolean
}

export type ProxyfiedStruct<T = Record<any, any>> = SuperStructPublic
  & {$super: SuperStruct}
  & T


export const STRUCT_PUBLIC_MEMBERS = [
  ...SUPER_VALUE_PROXY_PUBLIC_MEMBERS,
  'isStruct',
]


/**
 * Wrapper for SuperStruct which allows to manipulate it as common object.
 * And it puts some methods to it:
 * * struct.$super - instance of SuperStruct
 * * struct... - see other methods in STRUCT_PUBLIC_MEMBERS
 */
export function proxifyStruct(struct: SuperStruct): ProxyfiedStruct {
  const handler: ProxyHandler<Record<any, any>> = {
    get(target: any, prop: string) {
      // $super
      if (prop === SUPER_VALUE_PROP) return struct
      // public super struct prop
      else if (STRUCT_PUBLIC_MEMBERS.includes(prop)) return (struct as any)[prop]
      // else prop or object itself
      return struct.allValues[prop]
    },

    has(target: any, prop: string): boolean {
      if (prop === SUPER_VALUE_PROP || STRUCT_PUBLIC_MEMBERS.includes(prop)) return true

      return struct.allKeys.includes(prop)
    },

    set(target: any, prop: string, newValue: any): boolean {
      return struct.setOwnValue(prop, newValue)
    },

    deleteProperty(): boolean {
      throw new Error(`It isn't possible to delete struct value`)
    },

    ownKeys(): ArrayLike<string | symbol> {
      return struct.allKeys
    },
  }

  return new Proxy(struct.allValues, handler) as ProxyfiedStruct
}


/**
 * SuperStruct.
 * * It is allowed to make en empty struct, but it is useless
 * * It isn't possible to remove items from struct, but it is possible to set null
 */
export class SuperStruct<T = Record<string, AllTypes>>
  extends SuperValueBase<T>
  implements SuperStructPublic
{
  readonly isStruct = true
  // current values
  protected _values = {} as T
  protected proxyFn = proxifyStruct
  // It assumes that you will not change it after initialization
  private readonly definition: Record<keyof T, SuperItemDefinition> = {} as any

  get allKeys(): string[] {
    return Object.keys(this.allValues as any)
  }


  constructor(
    definition: Record<keyof T, SuperItemInitDefinition>,
    defaultRo: boolean = false
  ) {
    super()

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
    if (this.inited) throw new Error(`The struct has been already initialized`)

    this.events.emit(SUPER_VALUE_EVENTS.initStart)

    // set initial values
    for (const keyStr of Object.keys(this.definition)) {
      const keyName = keyStr as keyof T

      this._values[keyName] = this.resolveChildValue(
        this.definition[keyName],
        keyStr,
        initialValues?.[keyName]
      )
      // all the values has to be set at init time
      if (typeof this._values[keyName] === 'undefined') {
        throw new Error(
          `SuperStruct.init(). Value ${keyStr} has to be set in default or in initial values`
        )
      }
    }

    return super.init()
  }

  destroy = () => {
    super.destroy()
    // destroy all the children
    for (const key of this.allKeys) {
      const keyName = key as keyof T

      if (isSuperValue(this.allValues[keyName])) {
        // it will destroy itself and its children
        ((this.allValues[keyName] as any)[SUPER_VALUE_PROP] as SuperValueBase).destroy()
      }
    }
  }


  validateItem(key: string, value?: AllTypes, ignoreRo?: boolean) {
    // obviously check it otherwise it will be set to default
    if (typeof value === 'undefined') {
      throw new Error(`It isn't possible to set undefined to data child`)
    }

    super.validateItem(key, value, ignoreRo)
  }

  getOwnValue(key: string): AllTypes {
    return super.getOwnValue(key)
  }

  setOwnValue(key: string, value: AllTypes, ignoreRo: boolean = false): boolean {
    // obviously check it otherwise it will be set to default
    if (typeof value === 'undefined') {
      throw new Error(`It isn't possible to set undefined to data child`)
    }

    return super.setOwnValue(key, value, ignoreRo)
  }

  getProxy(): T & ProxyfiedStruct<T> {
    return super.getProxy()
  }

  getDefinition(keyStr: string): SuperItemDefinition | undefined {
    const key = keyStr as keyof T

    if (!this.definition[key]) {
      throw new Error(
        `SuperStruct "${this.pathToMe}" doesn't have definition of child "${keyStr}"`
      )
    }

    return this.definition[key]
  }

  async execute(
    scope: SuperScope,
    values: Record<any, any>,
    roSetter?: (name: string, value: any) => void
  ) {
    if (!isPlainObject(values)) return

    if (arrayDifference(Object.keys(values), this.allKeys).length > 0) {
      throw new Error(`Is is not allowed to add keys which arent in definition`)
    }

    return super.execute(scope, values, roSetter)
  }

  /////// Struct specific

  /**
   * Set value of self readonly value and rise an event
   */
  protected myRoSetter = (name: keyof T, newValue: AllTypes) => {
    this.setOwnValue(name as any, newValue, true)
  }

}
