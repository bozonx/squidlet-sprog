import {omitObj} from 'squidlet-lib';
import {SuperScope} from '../scope.js';
import {AllTypes, SIMPLE_TYPES} from '../types/valueTypes.js';
import {
  SuperValueBase,
  isSuperValue,
  SUPER_VALUE_PROP,
  SUPER_PROXY_PUBLIC_MEMBERS,
  SuperValuePublic
} from './SuperValueBase.js';
import {isCorrespondingType} from './isCorrespondingType.js';
import {
  DEFAULT_INIT_SUPER_DEFINITION,
  SuperItemDefinition,
  SuperItemInitDefinition
} from '../types/SuperItemDefinition.js';
import {resolveInitialSimpleValue} from './helpers.js';


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
      return Object.keys(omitObj(struct.values, SUPER_VALUE_PROP))
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
    this.checkDefinition(definition)

    this.definition = this.prepareDefinition(definition, defaultRo)
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

    // TODO: инициализацию наверное лучше сделать отдельно
    // TODO: будут ли init values???
    // // check required values
    // for (const keyStr of Object.keys(this.definition)) {
    //   const keyName = keyStr as keyof T
    //   if (this.definition[keyName].required && typeof this.values[keyName] === 'undefined') {
    //     throw new Error(`The value ${keyStr} is required, but it wasn't initiated`)
    //   }
    // }

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

  setOwnValue(key: string, value: AllTypes, ignoreRo: boolean = false) {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const name: keyof T = key as any

    if (typeof value === 'undefined') {
      throw new Error(`It isn't possible to set undefined to struct's child`)
    }
    else if (typeof this.definition[name] === 'undefined') {
      throw new Error(
        `Can't set value with name ${String(name)} which isn't defined in definition`
      )
    }
    else if (!ignoreRo && this.definition[name].readonly) {
      throw new Error(`Can't set readonly value of name ${String(name)}`)
    }
    else if (!isCorrespondingType(
      value,
      this.definition[name].type,
      this.definition[name].nullable
    )) {
      throw new Error(
        `The value ${String(name)} is not corresponding type ${this.definition[name].type}`
      )
    }

    this.values[name] = value as any

    this.riseChildrenChangeEvent(key)
  }

  /**
   * Set default value or null if the key doesn't have a default value
   * @param key
   */
  toDefaultValue = (key: string) => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    let defaultValue = this.definition[key as keyof T]?.default

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

  private prepareDefinition(
    definition: Record<keyof T, SuperItemInitDefinition>,
    defaultRo: boolean
  ): Record<keyof T, SuperItemDefinition> {
    const res: Record<keyof T, SuperItemDefinition> = {} as any

    for (const keyStr of Object.keys(definition)) {
      const keyName = keyStr as keyof T
      res[keyName] = {
        ...DEFAULT_INIT_SUPER_DEFINITION,
        ...definition[keyName],
        readonly: (defaultRo)
          // if ro was set to false in definition then leave false. In other cases true
          ? definition[keyName].readonly !== false
          // or just use that value which is was set in definition
          : Boolean(definition[keyName].readonly),
      }
    }

    return res
  }

  private checkDefinition(definition: Record<keyof T, SuperItemInitDefinition>,) {
    for (const keyStr of Object.keys(definition)) {
      const keyName = keyStr as keyof T


    }
  }

}
