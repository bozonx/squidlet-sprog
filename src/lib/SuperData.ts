import {deepClone, spliceItem} from 'squidlet-lib';
import {
  checkDefinition, isSuperValue,
  prepareDefinitionItem,
  SUPER_PROXY_PUBLIC_MEMBERS, SUPER_VALUE_EVENTS,
  SUPER_VALUE_PROP,
  SuperValueBase,
  SuperValuePublic
} from './SuperValueBase.js';
import {AllTypes, SIMPLE_TYPES} from '../types/valueTypes.js';
import {
  DEFAULT_INIT_SUPER_DEFINITION,
  SuperItemDefinition,
  SuperItemInitDefinition
} from '../types/SuperItemDefinition.js';
import {SuperScope} from '../scope.js';
import {checkValueBeforeSet} from './SuperStruct.js';
import {resolveInitialSimpleValue} from './helpers.js';


// TODO: проверить getValue, setValue будут ли они работать если ключ это число???
// TODO: makeChildPath не верно отработает если дадут число

// TODO: можно сортировать ключи, reverse, pop, etc
// TODO: добавление нового элемента это push
// TODO: добавить методы array - push, filter и итд


export interface SuperDataPublic extends SuperValuePublic {
  isData: boolean
}

export type ProxyfiedData<T = Record<any, any>> = SuperDataPublic
  & {$super: SuperData}
  & T


export const DATA_MEMBERS = [
  ...SUPER_PROXY_PUBLIC_MEMBERS,
  'isStruct',
]
export const DEFAULT_DEFINITION_KEY = '$DEFAULT'


export function proxyData(data: SuperData): ProxyfiedData {
  const handler: ProxyHandler<Record<any, any>> = {
    get(target: any, prop: string) {
      if (prop === SUPER_VALUE_PROP) {
        return data
      }
      else if (DATA_MEMBERS.includes(prop)) {
        // public super struct prop
        return (data as any)[prop]
      }
      // else prop or object itself
      return data.values[prop]
    },

    has(target: any, prop: string): boolean {
      if (prop === SUPER_VALUE_PROP || DATA_MEMBERS.includes(prop)) {
        return true
      }

      return Object.keys(data.values).includes(prop)
    },

    set(target: any, prop: string, newValue: any): boolean {
      data.setOwnValue(prop, newValue)

      return true
    },

    deleteProperty(target: any, prop: string): boolean {
      data.forget(prop)

      return true
    },

    ownKeys(): ArrayLike<string | symbol> {
      return Object.keys(data.values)
    },
  }

  return new Proxy(data.values, handler) as ProxyfiedData
}


export class SuperData<T extends Record<string, any> = Record<string, any>>
  extends SuperValueBase<Record<string| number, T>>
  implements SuperDataPublic
{
  readonly isData = true
  // put definition via special method, not straight
  readonly definition: Record<string, SuperItemDefinition> = {} as any
  // current values
  readonly values: Record<string, any> = {}
  // ordered keys
  readonly keys: string[] = []
  readonly defaultRo: boolean
  protected proxyFn = proxyData


  get defaultDefinition(): SuperItemDefinition | undefined {
    return this.definition[DEFAULT_DEFINITION_KEY]
  }


  constructor(
    scope: SuperScope,
    definition: Record<string, SuperItemInitDefinition> = {},
    defaultRo: boolean = false
  ) {
    super(scope)
    // save it to use later to define a new props
    this.defaultRo = defaultRo

    for (const keyStr of Object.keys(definition)) {
      // skip reset of default definition
      if (definition[keyStr] === null) continue

      checkDefinition(definition[keyStr])
      this.keys.push(keyStr)

      this.definition[keyStr] = prepareDefinitionItem(definition[keyStr], defaultRo)
    }
    // if wasn't set default definition then set it to allow any type
    if (typeof definition[DEFAULT_DEFINITION_KEY] === 'undefined') {
      this.definition[DEFAULT_DEFINITION_KEY] = DEFAULT_INIT_SUPER_DEFINITION
    }
    // else if null then do not register it at all
    // if (!this.definition[DEFAULT_DEFINITION_KEY]) {
    //   delete this.definition[DEFAULT_DEFINITION_KEY]
    // }
  }


  init = (initialValues?: T): ((name: keyof T, newValue: AllTypes) => void) => {
    if (this.inited) {
      throw new Error(`The struct has been already initialized`)
    }

    this.events.emit(SUPER_VALUE_EVENTS.initStart)

    // set initial values
    for (const key of Object.keys(this.definition)) {
      if (key === DEFAULT_DEFINITION_KEY) continue

      this.values[key] = this.setupChildValue(
        this.definition[key],
        key,
        initialValues?.[key]
      )
    }

    return super.init()
  }

  destroy = () => {
    super.destroy()

    for (const key of Object.keys(this.values)) {
      if (isSuperValue(this.values[key])) {
        // it will destroy itself and its children
        (this.values[key] as SuperValueBase).destroy()
      }
    }
  }


  isKeyReadonly(key: string | number): boolean {
    // TODO: что  случае с элементом массива???
    if (!this.definition[key]) {
      throw new Error(`Data doesn't have key ${key}`)
    }

    return Boolean(this.definition?.[key].readonly)
  }

  myKeys(): string[] {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return [...this.keys]
  }

  getOwnValue(key: string): AllTypes {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return this.values[key] as any
  }

  setOwnValue(key: string, value: AllTypes, ignoreRo?: boolean) {
    const definition = (this.definition[key])
      ? (this.definition[key])
      : this.definition[DEFAULT_DEFINITION_KEY]

    if (!definition) {
      throw new Error(`Doesn't have key ${key}`)
    }

    checkValueBeforeSet(this.isInitialized, definition, key, value, ignoreRo)

    // TODO: для массивов разрешать устанавливать value без definition

    this.values[key] = this.setupChildValue(definition, key, value)

    this.riseChildrenChangeEvent(key)
  }

  /**
   * Set default value or null if the key doesn't have a default value
   * @param key
   */
  toDefaultValue = (key: string) => {
    if (!this.isInitialized) throw new Error(`Init it first`)
      // TODO: а если массив?
    else if (!this.definition[key]) {
      throw new Error(`Struct doesn't have key ${key}`)
    }

    let defaultValue = this.definition[key]?.default

    // TODO: а если super type??? То надо вызвать default value у него ???
    //       или ничего не делать? Если менять заного то надо дестроить предыдущий

    // if no default value then make it from type
    if (
      Object.keys(SIMPLE_TYPES).includes(this.definition[key].type)
      && typeof defaultValue === 'undefined'
    ) {
      defaultValue = resolveInitialSimpleValue(
        this.definition[key].type as keyof typeof SIMPLE_TYPES,
        this.definition[key].nullable,
      )
    }

    this.setOwnValue(key, defaultValue)
  }

  getProxy(): T & ProxyfiedData<T> {
    return super.getProxy()
  }

  clone = (): T => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return deepClone(this.makeOrderedObject())
  }

  /////// Data specific

  /**
   * Set a new definition for a specific key. You can't replace or change it.
   */
  define(key: string, definition?: SuperItemInitDefinition, initialValue?: any) {
    if (this.keys.includes(key)) {
      throw new Error(`Can't redefine a new item. You have to call forget("${key}") first`)
    }

    if (definition) {
      checkDefinition(definition)

      this.definition[key] = prepareDefinitionItem(definition, this.defaultRo)
    }
    // do not set value if it is a default definition
    if (key === DEFAULT_DEFINITION_KEY) return

    let finalDef = this.definition[key] || this.definition[DEFAULT_DEFINITION_KEY]

    if (!finalDef) throw new Error(`Can't resolve definition`)

    this.keys.push(key)
    // set default value as value
    const defaultValue = this.setupChildValue(finalDef, key, initialValue)

    if (typeof defaultValue !== 'undefined') {
      // set value and rise an event
      this.setOwnValue(key, defaultValue)
    }

    this.events.emit(SUPER_VALUE_EVENTS.definition, key)
  }

  /**
   * Set default definition or remove it if null passed
   * @param definition
   */
  setDefaultDefinition(definition: SuperItemInitDefinition | null) {
    if (definition === null) {
      delete this.definition[DEFAULT_DEFINITION_KEY]

      return
    }

    this.define(DEFAULT_DEFINITION_KEY, definition)

    this.events.emit(SUPER_VALUE_EVENTS.definition, DEFAULT_DEFINITION_KEY)
  }

  /**
   * Remove value and definition it that way as they never exist
   * @param key
   */
  forget(key: string) {
    delete this.definition[key]

    if (key !== DEFAULT_DEFINITION_KEY) {
      delete this.values[key]

      // TODO: надо тогда вернуть на any иначе непонятно как проверять значения массива
      // TODO: либо реально удалить просто
      //if (key === DEFAULT_DEFINITION_KEY) return

      spliceItem(this.keys, key)

      // TODO: rise an change event
    }


    // TODO: без учёта массива происходит


    this.events.emit(SUPER_VALUE_EVENTS.definition, key)
  }

  // TODO: add delete array value


  /**
   * Set value of self readonly value and rise an event
   */
  protected myRoSetter = (name: keyof T, newValue: AllTypes) => {
    this.setOwnValue(name as any, newValue, true)
  }


  private makeOrderedObject(): Record<string, any> {
    const res: Record<string, any> = {}

    for (const key of this.keys) res[key] = this.values[key]

    return res
  }

}
