import {SuperScope} from '../scope.js';
import {AllTypes, SIMPLE_TYPES} from '../types/valueTypes.js';
import {
  SuperValueBase,
  isSuperValue,
  SUPER_VALUE_PROP,
  SUPER_PROXY_PUBLIC_MEMBERS,
  SuperValuePublic, checkDefinition, prepareDefinitionItem
} from './SuperValueBase.js';
import {
  SuperItemDefinition,
  SuperItemInitDefinition
} from '../types/SuperItemDefinition.js';
import {resolveInitialSimpleValue} from './helpers.js';



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
      return struct.values[prop]
    },

    has(target: any, prop: string): boolean {
      if (prop === SUPER_VALUE_PROP || STRUCT_PUBLIC_MEMBERS.includes(prop)) {
        return true
      }

      return Object.keys(struct.values).includes(prop)
    },

    set(target: any, prop: string, newValue: any): boolean {
      struct.setOwnValue(prop, newValue)

      return true
    },

    deleteProperty(): boolean {
      throw new Error(`It isn't possible to delete struct value`)
    },

    ownKeys(): ArrayLike<string | symbol> {
      return Object.keys(struct.values)
    },
  }

  return new Proxy(struct.values, handler) as ProxyfiedStruct
}


export class SuperStruct<T = Record<string, AllTypes>>
  extends SuperValueBase<T>
  implements SuperStructPublic
{
  readonly isStruct = true
  // It assumes that you will not change it after initialization
  readonly definition: Record<keyof T, SuperItemDefinition> = {} as any
  // current values
  readonly values = {} as T
  protected proxyFn = proxyStruct


  constructor(
    scope: SuperScope,
    definition: Record<keyof T, SuperItemInitDefinition>,
    defaultRo: boolean = false
  ) {
    super(scope)

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
    // set initial values
    for (const keyStr of Object.keys(this.definition)) {
      const keyName = keyStr as keyof T

      this.values[keyName] = this.setupChildValue(
        this.definition[keyName],
        keyStr,
        initialValues?.[keyName]
      )
    }

    return super.init()
  }

  destroy = () => {
    super.destroy()

    for (const key of Object.keys(this.values as any)) {
      const keyName = key as keyof T

      if (isSuperValue(this.values[keyName])) {
        // it will destroy itself and its children
        (this.values[keyName] as SuperValueBase).destroy()
      }
    }
  }


  isKeyReadonly(key: string | number): boolean {
    if (!this.definition[key as keyof T]) {
      throw new Error(`Struct doesn't have key ${key}`)
    }

    return Boolean(this.definition?.[key as keyof T].readonly)
  }

  myKeys(): string[] {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return Object.keys(this.values as any)
  }

  getOwnValue(key: string): AllTypes {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return this.values[key as keyof T] as any
  }

  setOwnValue(keyStr: string, value: AllTypes, ignoreRo: boolean = false) {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (!this.definition[keyStr as keyof T]) {
      throw new Error(`Struct doesn't have key ${keyStr}`)
    }

    const name: keyof T = keyStr as any
    // obviously check it otherwise it will be set to default
    if (typeof value === 'undefined') {
      throw new Error(`It isn't possible to set undefined to struct's child`)
    }
    else if (!ignoreRo && this.definition[name].readonly) {
      throw new Error(`Can't set readonly value of name ${String(name)}`)
    }

    this.values[name] = this.setupChildValue(this.definition[name], keyStr, value)

    this.riseChildrenChangeEvent(keyStr)
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


  /**
   * Set value of self readonly value and rise an event
   */
  protected myRoSetter = (name: keyof T, newValue: AllTypes) => {
    this.setOwnValue(name as any, newValue, true)
  }

}
