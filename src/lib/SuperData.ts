import {deepClone, spliceItem} from 'squidlet-lib';
import {
  checkDefinition, isSuperValue,
  prepareDefinitionItem,
  SUPER_PROXY_PUBLIC_MEMBERS,
  SUPER_VALUE_PROP,
  SuperValueBase,
  SuperValuePublic
} from './SuperValueBase.js';
import {AllTypes, SIMPLE_TYPES} from '../types/valueTypes.js';
import {SuperItemDefinition, SuperItemInitDefinition} from '../types/SuperItemDefinition.js';
import {SuperScope} from '../scope.js';
import {checkValueBeforeSet} from './SuperStruct.js';
import {resolveInitialSimpleValue} from './helpers.js';


// TODO: можно сортировать ключи, reverse, pop, etc
// TODO: добавление нового элемента это push
// TODO: а какой definition для элементов массива???
// TODO: несли нет definition то нельзя работать со значением
// TODO: проверить getValue, setValue будут ли они работать если ключ это число???
// TODO: makeChildPath не верно отработает если дадут число
// TODO: добавить методы array - push, filter и итд


export interface SuperDataPublic extends SuperValuePublic {
  isData: boolean
}

export type ProxyfiedData<T = Record<any, any>> = SuperDataPublic
  & {$super: SuperData}
  & T


export const STRUCT_DATA_MEMBERS = [
  ...SUPER_PROXY_PUBLIC_MEMBERS,
  'isStruct',
]


export function proxyData(data: SuperData): ProxyfiedData {
  const handler: ProxyHandler<Record<any, any>> = {
    get(target: any, prop: string) {
      if (prop === SUPER_VALUE_PROP) {
        return data
      }
      else if (STRUCT_DATA_MEMBERS.includes(prop)) {
        // public super struct prop
        return (data as any)[prop]
      }
      // else prop or object itself
      return data.values[prop]
    },

    has(target: any, prop: string): boolean {
      if (prop === SUPER_VALUE_PROP || STRUCT_DATA_MEMBERS.includes(prop)) {
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


  constructor(
    scope: SuperScope,
    definition: Record<keyof T, SuperItemInitDefinition>,
    defaultRo: boolean = false
  ) {
    super(scope)
    // save it to use later to define a new props
    this.defaultRo = defaultRo

    for (const keyStr of Object.keys(definition)) {
      checkDefinition(definition[keyStr])
      this.keys.push(keyStr)

      this.definition[keyStr] = prepareDefinitionItem(definition[keyStr], defaultRo)
    }
  }


  init = (initialValues?: T): ((name: keyof T, newValue: AllTypes) => void) => {
    if (this.inited) {
      throw new Error(`The struct has been already initialized`)
    }
    // set initial values
    for (const key of Object.keys(this.definition)) {
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
    checkValueBeforeSet(this.isInitialized, this.definition, key, value, ignoreRo)

    // TODO: для массивов разрешать устанавливать value без definition
    // TODO: можно для этого сделать спец definition - ARRDEF

    this.values[key] = this.setupChildValue(this.definition[key], key, value)

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
   * Set a new definition. You can't replace or change it.
   */
  define(key: string, definition: SuperItemInitDefinition) {
    if (this.definition[key]) throw new Error(`Can't replace definition "${key}"`)

    checkDefinition(definition)
    this.keys.push(key)

    this.definition[key] = prepareDefinitionItem(definition, this.defaultRo)
    // set default value as value
    const defaultValue = this.setupChildValue(this.definition[key], key)

    if (typeof defaultValue !== 'undefined') {
      // set value and rise an event
      this.setOwnValue(key, defaultValue)
    }
  }

  /**
   * Remove value and definition it that way as they never exist
   * @param key
   */
  forget(key: string) {
    delete this.definition[key]
    delete this.values[key]

    spliceItem(this.keys, key)

    // TODO: без учёта массива
    // TODO: rise an event
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
