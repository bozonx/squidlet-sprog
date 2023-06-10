import {
  SuperValueBase,
  SUPER_PROXY_PUBLIC_MEMBERS,
  SuperValuePublic,
  SUPER_VALUE_EVENTS,
} from './SuperValueBase.js';
import {
  SuperItemDefinition,
  SuperItemInitDefinition
} from '../types/SuperItemDefinition.js';
import {
  checkDefinition,
  checkValueBeforeSet,
  prepareDefinitionItem,
  SUPER_VALUE_PROP,
  validateChildValue
} from './superValueHelpers.js';
import {AllTypes, SIMPLE_TYPES} from '../types/valueTypes.js';
import {resolveInitialSimpleValue} from './resolveInitialSimpleValue.js';


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
      return struct.values[prop]
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

  return new Proxy(struct.values, handler) as ProxyfiedStruct
}


export class SuperStruct<T = Record<string, AllTypes>>
  extends SuperValueBase<T>
  implements SuperStructPublic
{
  readonly isStruct = true
  // current values
  readonly values = {} as T
  protected proxyFn = proxifyStruct
  // It assumes that you will not change it after initialization
  private readonly definition: Record<keyof T, SuperItemDefinition> = {} as any

  get allKeys(): string[] {
    return Object.keys(this.values as any)
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

      this.values[keyName] = this.resolveChildValue(
        this.definition[keyName],
        keyStr,
        initialValues?.[keyName]
      )
    }

    return super.init()
  }

  destroy = () => {
    super.destroy()

    for (const key of this.allKeys) {
      const keyName = key as keyof T

      if (typeof this.values[keyName] === 'object' && (this.values[keyName] as any).destroy) {
        // it will destroy itself and its children
        (this.values[keyName] as SuperValueBase).destroy()
      }
    }
  }


  getProxy(): T & ProxyfiedStruct<T> {
    return super.getProxy()
  }

  getDefinition(keyStr: string): SuperItemDefinition | undefined {
    const key = keyStr as keyof T

    return this.definition[key]
  }

  /////// Struct specific

  /**
   * Set value of self readonly value and rise an event
   */
  protected myRoSetter = (name: keyof T, newValue: AllTypes) => {
    this.setOwnValue(name as any, newValue, true)
  }

}
