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
  checkDefinition, isSuperKind, isSuperValue,
  prepareDefinitionItem,
  SUPER_VALUE_PROP,
} from './superValueHelpers.js';
import {AllTypes} from '../types/valueTypes.js';
import {SuperScope} from './scope.js';
import {isSprogExpr} from '../lang/helpers.js';
import {SprogDefinition} from '../types/types.js';


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

      const def = prepareDefinitionItem(
        definition[keyStr as keyof T],
        defaultRo
      )

      if (!def.required && !def.nullable) {
        // TODO: надо убедиться что стоит либо required либо nullable
        //    чтобы нельзя было удалять потомка установив undefined.
        //    ставить null норм
        // TODO: или может автоматом ставить nullable ???
        // throw new Error(
        //   `SuperStruct definition of "${keyStr}" is not required and not nullable!`
        // )
      }

      this.definition[keyStr as keyof T] = def
    }
  }


  /**
   * Init with initial values.
   * It returns setter for readonly params
   */
  init = (initialValues?: T): ((name: keyof T, newValue: AllTypes) => void) => {

    // TODO: initialValues а если там указанны super значения, а в definition простые?

    if (this.inited) throw new Error(`The struct has been already initialized`)

    this.events.emit(SUPER_VALUE_EVENTS.initStart)

    // set initial values
    for (const keyStr of Object.keys(this.definition)) {
      const keyName = keyStr as keyof T

      // TODO: если expression вместо значения ?? сразу выполнить или просто пропустить
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
    // destroy all the children
    for (const key of this.allKeys) {
      const keyName = key as keyof T

      if (isSuperValue(this.values[keyName])) {
        // it will destroy itself and its children
        ((this.values[keyName] as any)[SUPER_VALUE_PROP] as SuperValueBase).destroy()
      }
    }
  }


  getProxy(): T & ProxyfiedStruct<T> {
    return super.getProxy()
  }

  getDefinition(keyStr: string): SuperItemDefinition | undefined {
    const key = keyStr as keyof T

    if (!this.definition[key]) {
      throw new Error(
        `SuperStruct "${this.pathToMe}" doesn't have definiton of child "${keyStr}"`
      )
    }

    return this.definition[key]
  }

  /////// Struct specific

  /**
   * Execute expressions of elements of struct
   * or set value from simpleValues if value is not expression
   * @param scope
   * @param simpleValues
   */
  async execute(scope: SuperScope, simpleValues?: Record<any, any>) {

    // TODO: это же в массиве и в data (с учетом наложения)

    for (const propKey of this.allKeys) {

      // TODO: вглубину

      const prop = this.values[propKey as keyof T]

      if (isSprogExpr(prop)) {
        // if expression
        this.setOwnValue(propKey, await scope.$run(prop as SprogDefinition))
      }
      else {
        // if it isn't common sprog expr
        // set value for simple values, not expressions
        if (simpleValues?.[propKey]) this.setOwnValue(propKey, simpleValues[propKey])
      }
    }
  }


  /**
   * Set value of self readonly value and rise an event
   */
  protected myRoSetter = (name: keyof T, newValue: AllTypes) => {
    this.setOwnValue(name as any, newValue, true)
  }

}
