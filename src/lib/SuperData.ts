import {deepClone} from 'squidlet-lib';
import {
  checkDefinition,
  prepareDefinitionItem,
  SUPER_PROXY_PUBLIC_MEMBERS,
  SUPER_VALUE_PROP,
  SuperValueBase,
  SuperValuePublic
} from './SuperValueBase.js';
import {AllTypes, SIMPLE_TYPES} from '../types/valueTypes.js';
import {SuperItemDefinition, SuperItemInitDefinition} from '../types/SuperItemDefinition.js';
import {SuperScope} from '../scope.js';


// TODO: можно сортировать ключи, reverse, pop, etc
// TODO: добавление нового элемента это push
// TODO: а какой definition для элементов массива???
// TODO: добавить default ro
// TODO: можно добавлять definition
// TODO: нельзя изменять definition
// TODO: можно удалять definition
// TODO: несли нет definition то нельзя работать со значением


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

    // TODO: add
    // deleteProperty(): boolean {
    // },

    ownKeys(): ArrayLike<string | symbol> {
      return Object.keys(data.values)
    },
  }

  return new Proxy(data.values, handler) as ProxyfiedData
}


// TODO: проверить getValue, setValue будут ли они работать если ключ это число???
// TODO: makeChildPath не верно отработает если дадут число
// TODO: добавить методы array - push, filter и итд

export class SuperData<T extends Record<string, any> = Record<string, any>>
  extends SuperValueBase<Record<string| number, T>>
  implements SuperDataPublic
{
  readonly isData = true
  // put definition via special method, not straight
  readonly definition: Record<string, SuperItemDefinition> = {} as any
  // current values
  readonly values = {} as T
  // ordered keys
  readonly keys: string[] = []
  protected proxyFn = proxyData


  constructor(scope: SuperScope, definition: Record<keyof T, SuperItemInitDefinition>) {
    super(scope)

    for (const keyStr of Object.keys(definition)) {
      checkDefinition(definition[keyStr])
      this.keys.push(keyStr)

      this.definition[keyStr] = prepareDefinitionItem(definition[keyStr])
    }
  }


  init = (initialValues?: T): ((name: keyof T, newValue: AllTypes) => void) => {
    return super.init()

    // TODO: ADD

    // TODO: fill keys
  }

  destroy = () => {
    super.destroy()

    // TODO: ADD
  }


  isKeyReadonly(key: string | number): boolean {
    return Boolean(this.definition?.[key].readonly)
  }

  myKeys(): string[] {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return [...this.keys]
  }

  getOwnValue(key: string): AllTypes {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return this.values[key as keyof T] as any
  }

  setOwnValue(keyStr: string, value: AllTypes, ignoreRo: boolean = false) {

    // TODO: ADD

    // if (!this.isInitialized) throw new Error(`Init it first`)
    //
    // const name: keyof T = keyStr as any
    // // obviously check it otherwise it will be set to default
    // if (typeof value === 'undefined') {
    //   throw new Error(`It isn't possible to set undefined to struct's child`)
    // }
    // else if (!ignoreRo && this.definition[name].readonly) {
    //   throw new Error(`Can't set readonly value of name ${String(name)}`)
    // }
    //
    // this.values[name] = this.setupChildValue(this.definition[name], keyStr, value)
    //
    // this.riseChildrenChangeEvent(keyStr)
  }

  // TODO: add delete value

  /**
   * Set default value or null if the key doesn't have a default value
   * @param key
   */
  toDefaultValue = (key: string | number) => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    let defaultValue = this.definition[key]?.default

    // TODO: а если super type??? То надо вызвать default value у него ???
    //       или ничего не делать? Если менять заного то надо дестроить предыдущий

    // if (
    //   Object.keys(SIMPLE_TYPES).includes(this.definition[key as keyof T].type)
    //   && typeof defaultValue === 'undefined'
    // ) {
    //   defaultValue = resolveInitialSimpleValue(
    //     this.definition[key as keyof T].type as keyof typeof SIMPLE_TYPES,
    //     this.definition[key as keyof T].nullable,
    //   )
    // }
    //
    // this.setOwnValue(key, defaultValue)
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
    checkDefinition(definition)
    this.keys.push(key)

    this.definition[key] = prepareDefinitionItem(definition)

    // TODO: set default value to value
  }

  undefine() {

  }

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
