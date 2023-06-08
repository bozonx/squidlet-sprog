import {
  deepClone,
  spliceItem,
  omitObj,
  concatUniqStrArrays,
  deduplicate,
  splitDeepPath
} from 'squidlet-lib';
import {
  checkDefinition,
  prepareDefinitionItem,
  SUPER_PROXY_PUBLIC_MEMBERS, SUPER_VALUE_EVENTS,
  SUPER_VALUE_PROP,
  SuperValueBase,
  SuperValuePublic,
} from './SuperValueBase.js';
import {AllTypes, SIMPLE_TYPES} from '../types/valueTypes.js';
import {
  DEFAULT_INIT_SUPER_DEFINITION,
  SuperItemDefinition,
  SuperItemInitDefinition
} from '../types/SuperItemDefinition.js';
import {SuperScope} from './scope.js';
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
      return data.layeredValues[prop]
    },

    has(target: any, prop: string): boolean {
      if (prop === SUPER_VALUE_PROP || DATA_MEMBERS.includes(prop)) {
        return true
      }

      return data.allKeys().includes(prop)
    },

    set(target: any, prop: string, newValue: any): boolean {

      // TODO: а почему не в слой???
      data.setOwnValue(prop, newValue)

      return true
    },

    deleteProperty(target: any, prop: string): boolean {
      data.forget(prop)

      return true
    },

    ownKeys(): ArrayLike<string | symbol> {
      return data.ownKeys
    },
  }

  return new Proxy(data.ownValues, handler) as ProxyfiedData
}

export function proxifyLayeredValue(topValue: Record<string, any>, bottomData?: SuperValueBase) {
  const handler: ProxyHandler<Record<any, any>> = {
    get(target: any, prop: string) {
      if (Object.keys(topValue).includes(prop)) return topValue[prop]

      return bottomData?.getValue(prop)
    },

    has(target: any, prop: string): boolean {
      return Object.keys(topValue).includes(prop)
        || (bottomData?.allKeys() || []).includes(prop)
    },

    set(target: any, prop: string, newValue: any): boolean {
      if (Object.keys(topValue).includes(prop)) {
        // if var is defined in top value - set to it
        topValue[prop] = newValue
      }
      else if (bottomData && Object.keys(bottomData.ownValues).includes(prop)) {
        // TODO: почему own ???
        // if var is defined in bottom value - set to it
        bottomData.setOwnValue(prop, newValue)
      }
      else {
        // otherwise just define a new var in top value
        topValue[prop] = newValue
      }

      return true
    },

    deleteProperty(target: any, prop: string): boolean {
      throw new Error(`Don't delete via value proxy! User forget() instead`)
    },

    ownKeys(): ArrayLike<string | symbol> {
      // it has to return all the keys on Reflect.ownKeys()
      return deduplicate([
        ...(bottomData?.allKeys() || []),
        ...Object.keys(topValue),
      ])
    },
  }

  return new Proxy(topValue, handler)
}


export class SuperData<T extends Record<string, any> = Record<string, any>>
  extends SuperValueBase<Record<string| number, T>>
  implements SuperDataPublic
{
  readonly isData = true
  // put definition via special method, not straight
  readonly definition: Record<string, SuperItemDefinition> = {} as any
  // current values
  readonly ownValues: Record<string, any> = {}
  // TODO: сделать protected
  readonly layeredValues: Record<string, any>
  // ordered keys
  readonly myKeys: string[] = []
  readonly defaultRo: boolean
  protected proxyFn = proxyData


  get defaultDefinition(): SuperItemDefinition | undefined {
    return this.definition[DEFAULT_DEFINITION_KEY]
  }

  /**
   * Keys only of me, not low layer and not children's
   */
  get ownKeys(): string[] {
    return [...this.myKeys]
  }


  constructor(
    definition: Record<string, SuperItemInitDefinition> = {},
    defaultRo: boolean = false,
    lowLayer?: SuperData
  ) {
    if (lowLayer && !lowLayer.isData) {
      throw new Error(`Super data can inherit only other super data`)
    }
    else if (lowLayer && lowLayer.pathToMe) {
      throw new Error(`Layers can't have paths. It doesn't developed at the moment.`)
    }

    super(lowLayer as SuperValueBase | undefined)

    // save it to use later to define a new props
    this.defaultRo = defaultRo
    this.layeredValues = proxifyLayeredValue(this.ownValues, lowLayer as SuperValueBase | undefined)
    // setup definitions
    for (const keyStr of Object.keys(definition)) {
      // skip reset of default definition
      if (definition[keyStr] === null) continue

      checkDefinition(definition[keyStr])
      this.myKeys.push(keyStr)

      this.definition[keyStr] = prepareDefinitionItem(definition[keyStr], defaultRo)
    }
    // if wasn't set default definition then set it to allow any type
    if (typeof definition[DEFAULT_DEFINITION_KEY] === 'undefined') {
      this.definition[DEFAULT_DEFINITION_KEY] = DEFAULT_INIT_SUPER_DEFINITION
    }
    // else if null then do not register it at all
  }


  init = (initialValues?: T): ((name: keyof T, newValue: AllTypes) => void) => {
    if (this.inited) {
      throw new Error(`The struct has been already initialized`)
    }

    this.events.emit(SUPER_VALUE_EVENTS.initStart)

    const keys = concatUniqStrArrays(
      Object.keys(omitObj(this.definition, DEFAULT_DEFINITION_KEY)),
      Object.keys(initialValues || {})
    )
    // set initial values of my layer
    for (const key of keys) {
      const def = this.definition[key] || this.defaultDefinition

      if (!def) throw new Error(`Can't resolve definition of key "${key}"`)
      // add key
      if (!this.myKeys.includes(key)) this.myKeys.push(key)
      // set value
      this.ownValues[key] = this.setupChildValue(def, key, initialValues?.[key])
    }
    // listen to bottom layer changes of which children which upper layer doesn't have
    if (this.lowLayer) {
      this.lowLayer.subscribe((target: SuperValueBase, path) => {
        if (!this.lowLayer?.isInitialized) return
        // skip events of whole super data
        else if (!path || path === this.myPath) return

        const splatPath = splitDeepPath(path)
        const childKeyStr = String(splatPath[0])
        // if it is another key not I have then rise an event of my level
        if (!this.ownKeys.includes(childKeyStr)) {
          this.events.emit(SUPER_VALUE_EVENTS.change, target, path)
        }
      })
    }

    return super.init()
  }

  destroy = () => {
    super.destroy()

    for (const key of Object.keys(this.ownValues)) {
      if (typeof this.ownValues[key] === 'object' && this.ownValues[key].destroy) {
        // it will destroy itself and its children
        (this.ownValues[key] as SuperValueBase).destroy()
      }
    }
  }


  isKeyReadonly(key: string | number): boolean {
    const def = this.getDefinition(key)

    if (!def) {
      throw new Error(`Data doesn't have definition of key "${key}"`)
    }

    return def.readonly
  }

  getOwnValue(key: string): AllTypes {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return this.ownValues[key] as any
  }

  setOwnValue(key: string, value: AllTypes, ignoreRo?: boolean): boolean {
    const definition = (this.definition[key])
      ? (this.definition[key])
      : this.definition[DEFAULT_DEFINITION_KEY]

    if (!definition) {
      throw new Error(`Doesn't have key ${key}`)
    }

    checkValueBeforeSet(this.isInitialized, definition, key, value, ignoreRo)

    // TODO: для массивов разрешать устанавливать value без definition

    this.ownValues[key] = this.setupChildValue(definition, key, value)

    if (!this.myKeys.includes(key)) this.myKeys.push(key)

    this.riseChildrenChangeEvent(key)

    return true
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
  // TODO: test
  batchSet(values?: Record<string, any>) {
    if (!values) return

    for (const key of Object.keys(values)) {
      this.setOwnValue(key, values[key])
    }
  }

  /**
   * Set a new definition for a specific key. You can't replace or change it.
   */
  define(key: string, definition?: SuperItemInitDefinition, initialValue?: any) {
    if (this.myKeys.includes(key)) {
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

    this.myKeys.push(key)
    // set default value as value
    const defaultValue = this.setupChildValue(finalDef, key, initialValue)

    if (typeof defaultValue !== 'undefined') {
      // set value and rise an event
      this.setOwnValue(key, defaultValue, true)
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

  // TODO: можно переместить в SuperValueBase
  getDefinition(key: string | number): SuperItemDefinition | undefined {
    if (this.definition[key]) {
      return this.definition[key] || this.defaultDefinition
    }
    else if (this.lowLayer) {
      return (this.lowLayer as SuperData).getDefinition(key)
    }
  }

  /**
   * Remove value and definition it that way as they never exist
   * @param key
   */
  forget(key: string) {
    delete this.definition[key]

    if (key !== DEFAULT_DEFINITION_KEY) {
      delete this.ownValues[key]

      if (this.lowLayer) {
        const lowLayer = this.lowLayer as SuperData

        if (lowLayer.forget) lowLayer.forget(key)
      }

      // TODO: надо тогда вернуть на any иначе непонятно как проверять значения массива
      // TODO: либо реально удалить просто
      //if (key === DEFAULT_DEFINITION_KEY) return

      spliceItem(this.myKeys, key)

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

    for (const key of this.allKeys()) res[key] = this.layeredValues[key]

    return res
  }

}
