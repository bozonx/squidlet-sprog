import {
  deepClone,
  omitObj,
  concatUniqStrArrays,
  deduplicate,
  splitDeepPath,
  joinDeepPath,
} from 'squidlet-lib';
import {
  SUPER_VALUE_PROXY_PUBLIC_MEMBERS,
  SUPER_VALUE_EVENTS,
  SuperValueBase,
  SuperValuePublic,
} from './SuperValueBase.js';
import {
  DEFAULT_INIT_SUPER_DEFINITION,
  SuperItemDefinition,
  SuperItemInitDefinition
} from '../types/SuperItemDefinition.js';
import {
  checkDefinition,
  checkBeforeSetValue,
  isSuperValue,
  prepareDefinitionItem,
  SUPER_VALUE_PROP,
  validateChildValue
} from './superValueHelpers.js';
import {AllTypes} from '../types/valueTypes.js';
import {ProxyfiedSuperBase} from './SuperBase.js';


export interface SuperDataPublic extends SuperValuePublic {
  isData: boolean
}

export type ProxyfiedData<T = Record<any, any>> = SuperDataPublic
  & {$super: SuperData}
  & T


export const DATA_PUBLIC_MEMBERS = [
  ...SUPER_VALUE_PROXY_PUBLIC_MEMBERS,
  'isData',
]
export const DEFAULT_DEFINITION_KEY = '$DEFAULT'


export function proxifyData(data: SuperData): ProxyfiedData {
  const handler: ProxyHandler<Record<any, any>> = {
    get(target: any, prop: string) {
      // $super
      if (prop === SUPER_VALUE_PROP) return data
      // public super data prop
      else if (DATA_PUBLIC_MEMBERS.includes(prop)) return (data as any)[prop]
      // else prop or object itself or bottom layer
      return data.allValues[prop]
    },

    has(target: any, prop: string): boolean {
      if (prop === SUPER_VALUE_PROP || DATA_PUBLIC_MEMBERS.includes(prop)) return true

      return data.allKeys.includes(prop)
    },

    set(target: any, prop: string, newValue: any): boolean {
      // set to me or to bottom layer
      return data.setValue(prop, newValue)
    },

    deleteProperty(target: any, prop: string): boolean {
      throw new Error(`Don't delete via value proxy! User forget() instead`)
    },

    ownKeys(): ArrayLike<string | symbol> {
      // to deep functions need that Reflect.ownKeys()
      // get all the keys including bottom layer
      return data.allKeys
    },
  }

  return new Proxy(data.ownValues, handler) as ProxyfiedData
}

export function proxifyLayeredValue(topOwnValues: Record<string, any>, bottomData?: SuperData) {
  const handler: ProxyHandler<Record<any, any>> = {
    get(target: any, prop: string) {
      if (Object.keys(topOwnValues).includes(prop)) return topOwnValues[prop]

      return bottomData?.getValue(prop)
    },

    has(target: any, prop: string): boolean {
      return Object.keys(topOwnValues).includes(prop)
        || (bottomData?.allKeys || []).includes(prop)
    },

    set(target: any, prop: string, newValue: any): boolean {
      if (
        !Object.keys(topOwnValues).includes(prop)
        && bottomData && bottomData.allKeys.includes(prop)
      ) {
        // if var is defined only in bottom value and not in top level
        // set value to it or its lower levels
        return bottomData.setValue(prop, newValue)
      }
      // else if var is defined in top value - set to it
      // or just define a new var in top value
      topOwnValues[prop] = newValue

      return true
    },

    deleteProperty(target: any, prop: string): boolean {
      throw new Error(`Don't delete via value proxy! User forget() instead`)
    },

    ownKeys(): ArrayLike<string | symbol> {
      // it has to return all the keys on Reflect.ownKeys()
      return deduplicate([
        ...(bottomData?.allKeys || []),
        ...Object.keys(topOwnValues),
      ])
    },

    getPrototypeOf(target): object | null {
      if (target !== topOwnValues) return target.prototype

      return bottomData?.allValues || null
    }
  }

  return new Proxy(topOwnValues, handler)
}


export class SuperData<T extends Record<string, AllTypes> = Record<string, AllTypes>>
  extends SuperValueBase<T>
  implements SuperDataPublic
{
  readonly isData = true
  // values only of this layer. Do not use it, use setValue, getValue instead.
  // The type doesn't matter because it is for inner use only
  // Do not replace the object outside!!!
  // The object can be relaced on change - do not rely on the object will accept changes
  // isntead of it listen to change event and cathc the freshiest changed
  ownValues: Record<any, any> = {}
  // proxy which allows to manipulate with all layers. Do not use it at all.
  // it only for getValue and setValue and other inner methods.
  readonly defaultRo: boolean
  readonly bottomLayer?: SuperData
  protected _values: T
  protected proxyFn = proxifyData
  // put definition via special method, not straight
  private readonly definition: Record<string, SuperItemDefinition> = {} as any

  get defaultDefinition(): SuperItemDefinition | undefined {
    return this.definition[DEFAULT_DEFINITION_KEY]
  }

  /**
   * All the keys of my and bottom layer
   */
  get allKeys(): string[] {
    return deduplicate([
      ...(this.bottomLayer?.allKeys || []),
      ...this.ownKeys,
    ])
  }

  /**
   * Keys only of me, not bottom layer and not children's
   */
  get ownKeys(): string[] {
    return Object.keys(this.ownValues)
  }

  get ownValuesStrict(): T {
    return this.ownValues as T
  }


  constructor(
    definition: Record<string, SuperItemInitDefinition> = {},
    defaultRo: boolean = false,
    bottomLayer?: SuperData
  ) {
    if (bottomLayer && !bottomLayer.isData) {
      throw new Error(`Super data can inherit only other super data`)
    }
    else if (bottomLayer && bottomLayer.pathToMe) {
      throw new Error(`Layers can't have paths. It doesn't developed at the moment.`)
    }

    super()

    this.bottomLayer = bottomLayer
    // save it to use later to define a new props
    this.defaultRo = defaultRo
    this._values = proxifyLayeredValue(this.ownValues, bottomLayer)
    // setup definitions
    for (const keyStr of Object.keys(definition)) {
      // skip reset of default definition
      if (definition[keyStr] === null) continue

      checkDefinition(definition[keyStr])

      this.definition[keyStr] = prepareDefinitionItem(definition[keyStr], defaultRo)
    }
    // if wasn't set default definition then set it to allow any type
    if (typeof definition[DEFAULT_DEFINITION_KEY] === 'undefined') {
      this.definition[DEFAULT_DEFINITION_KEY] = DEFAULT_INIT_SUPER_DEFINITION
    }
    // else if null then do not register it at all
  }


  init = (initialValues?: T): ((name: keyof T, newValue: AllTypes) => void) => {
    if (this.inited) throw new Error(`The data has been already initialized`)

    this.events.emit(SUPER_VALUE_EVENTS.initStart)

    const keys = concatUniqStrArrays(
      Object.keys(omitObj(this.definition, DEFAULT_DEFINITION_KEY)),
      Object.keys(initialValues || {})
    )
    // set initial values of my layer
    for (const key of keys) {
      const def = this.definition[key] || this.defaultDefinition

      if (!def) throw new Error(`Can't resolve definition of key "${key}"`)
      // set value
      this.ownValues[key] = this.resolveChildValue(def, key, initialValues?.[key])
    }
    // listen to bottom layer changes of which children which upper layer doesn't have
    if (this.bottomLayer) {
      this.bottomLayer.subscribe((target: SuperValueBase, path) => {
        if (!this.bottomLayer?.isInitialized) return
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
      if (isSuperValue(this.ownValues[key])) {
        // it will destroy itself and its children
        (this.ownValues[key][SUPER_VALUE_PROP] as SuperValueBase).destroy()
      }
    }
  }

  $$setParent(parent: ProxyfiedSuperBase, myPath: string) {
    if (this.bottomLayer) {
      throw new Error(`It doesn't support to set parent to layered SuperData`)
    }

    super.$$setParent(parent, myPath)
  }

  $$setPath(myNewPath: string) {
    super.$$setPath(myNewPath)

    if (this.bottomLayer) this.bottomLayer.$$setPath(myNewPath)
  }


  getOwnValue(key: string): AllTypes {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return this.ownValues[key] as any
  }

  setOwnValue(key: string, value: AllTypes, ignoreRo: boolean = false): boolean {
    // get only own definition or default one
    const definition = (this.definition[key])
      ? (this.definition[key])
      : this.defaultDefinition

    checkBeforeSetValue(this.isInitialized, definition, key, ignoreRo)

    this.ownValues[key] = this.resolveChildValue(definition!, key, value)

    this.emitChildChangeEvent(key)


    // TODO: - добавить событие added в setOwnValue
    // TODO: - в setOwnValue создавать заного объект
    // TODO: - тоже везде где добавляется параметр


    return true
  }


  /**
   * Set value deeply.
   * You can set own value or value of some deep object.
   * Even you can set value to the deepest primitive like: struct.struct.num = 5
   * @returns {boolean} if true then value was found and set. If false value hasn't been set
   */
  setValue = (pathTo: string, newValue: AllTypes): boolean => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (typeof pathTo !== 'string') throw new Error(`path has to be a string`)

    const splat = splitDeepPath(pathTo)
    const keyStr = String(splat[0])

    if (splat.length === 1) {
      if (
        !this.ownKeys.includes(keyStr)
        && this.bottomLayer && this.bottomLayer.allKeys.includes(keyStr)
      ) {
        // if not own key but layered key
        const lowPath = joinDeepPath([splat[0]])

        return this.bottomLayer.setValue(lowPath, newValue)
      }
      // else own value - there splat[0] is number or string
      // if it is a new var then set it to top layer
      return this.setOwnValue(keyStr, newValue)
    }
    // deep child
    return this.setDeepChild(pathTo, newValue)
  }


  /**
   * Set default value or null if the key doesn't have a default value.
   * It will call walues of bottom layer which doesn't exist on this layer
   * @param key
   */
  toDefaultValue(key: string) {
    // it includes bottom layer's extra keys
    super.toDefaultValue(key)
  }

  getProxy(): T & ProxyfiedData<T> {
    return super.getProxy()
  }

  clone = (): T => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return deepClone(this.makeFullOrderedObject())
  }

  /**
   * Get own definition or bottom definition or own default definition
   * @param key
   * @param noDefault
   */
  getDefinition(key: string, noDefault: boolean = false): SuperItemDefinition | undefined {
    // first try to get own definition
    if (this.definition[key]) {
      return this.definition[key]
    }

    const bottomDef = this.bottomLayer?.getDefinition(key, true)

    // else try to get definition from bottom layer
    if (bottomDef) {
      return bottomDef
    }
    // else return own default definition
    else if (!noDefault) {
      return this.defaultDefinition
    }
    // else undefined
  }

  /////// Data specific methods

  validateItem(key: string, value?: AllTypes, ignoreRo?: boolean) {
    const definition = (this.definition[key])
      ? (this.definition[key])
      : this.defaultDefinition

    checkBeforeSetValue(this.isInitialized, definition, key, ignoreRo)
    validateChildValue(definition, key, value)
  }

  /**
   * Set a new definition for a specific key. You can't replace or change it.
   */
  define(key: string, definition?: SuperItemInitDefinition, initialValue?: any) {
    if (this.ownKeys.includes(key)) {
      throw new Error(`Can't redefine a new item. You have to call forget("${key}") first`)
    }

    if (definition) {
      checkDefinition(definition)

      this.definition[key] = prepareDefinitionItem(definition, this.defaultRo)
    }
    // do not set value if it is a default definition
    if (key === DEFAULT_DEFINITION_KEY) {
      // rise definition change event
      this.events.emit(SUPER_VALUE_EVENTS.definition, key)

      return
    }
    // set the default value
    let finalDef = this.definition[key] || this.defaultDefinition

    if (!finalDef) throw new Error(`Can't resolve definition`)

    // resolve default or initial value as value
    const defaultValue = this.resolveChildValue(finalDef, key, initialValue)

    if (typeof defaultValue !== 'undefined') {
      // set value and rise a child change event
      this.setOwnValue(key, defaultValue, true)
    }
    // rise definition change event
    this.events.emit(SUPER_VALUE_EVENTS.definition, key)
  }

  /**
   * Set default definition or remove it if null passed
   * @param definition
   */
  setDefaultDefinition(definition: SuperItemInitDefinition | null) {
    if (definition === null) {
      delete this.definition[DEFAULT_DEFINITION_KEY]

      this.events.emit(SUPER_VALUE_EVENTS.definition, DEFAULT_DEFINITION_KEY)

      return
    }

    this.define(DEFAULT_DEFINITION_KEY, definition)

    this.events.emit(SUPER_VALUE_EVENTS.definition, DEFAULT_DEFINITION_KEY)
  }

  /**
   * Remove value and definition in that way as they never exist.
   * It removes value and definition from bottom layer too.
   * @param key
   */
  forget(key: string) {
    if (key === DEFAULT_DEFINITION_KEY) {
      throw new Error(`Can't remove the default definition`)
    }
    // else remove definition for non array-like child
    delete this.definition[key]
    // remove own value
    delete this.ownValues[key]

    if (this.bottomLayer) {
      const bottomLayer = this.bottomLayer
      // if bottom layer has forget() method - then do it
      if (bottomLayer.forget) bottomLayer.forget(key)
    }
    // rise definition change event
    this.events.emit(SUPER_VALUE_EVENTS.definition, key)
    // rise child change event
    this.emitChildChangeEvent(key)
  }

  /**
   * Add to the beginning of keys array
   * @param key
   * @param value
   */
  addToBeginning(key: string, value: any) {
    if (!this.isInitialized) throw new Error(`Init it first`)

    // TODO: а слои???
    // TODO: может добавить тип типа - SuperChangeHandler

    this.ownValues = {[key]: value, ...this.ownValues}

    this.events.emit(SUPER_VALUE_EVENTS.added, this, this.pathToMe, [value], [key])
    // emit change event for whole array.
    // This means any change of array order - add, remove and move
    this.emitMyEvent()
  }

  /**
   *
   * @param value
   */
  create(value: AllTypes): symbol {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const sym = Symbol()

    // TODO: add

    return sym
  }

  moveByPosition(posToMove: number, newPosition: number): boolean {
    if (!this.isInitialized) throw new Error(`Init it first`)

    // TODO: а слои???

    const keys = Object.keys(this.ownValues)

    // TODO: add

    return true
  }

  eachMap() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add - вернуть объект
  }

  // TODO: add assign

  ////////// Array-like mutable methods
  // to use push() - just use setOwnValue()
  // to use splice() - use forget


  // pop() {
  //   if (!this.isInitialized) throw new Error(`Init it first`)
  //   // TODO: add
  // }
  //
  // shift() {
  //   if (!this.isInitialized) throw new Error(`Init it first`)
  //   // TODO: add
  // }

  reverse() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  sort(compareFn?: (a: T, b: T) => number) {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  //////// Not mutable methods

  filter() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  find() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  findIndex() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  findLast() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  findLastIndex() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  forEach() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  includes() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  indexOf() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  join() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  lastIndexOf() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  map() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  slice() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  reduce() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }

  reduceRight() {
    if (!this.isInitialized) throw new Error(`Init it first`)
    // TODO: add
  }


  /**
   * Set value of self readonly value and rise an event
   */
  protected myRoSetter = (name: keyof T, newValue: AllTypes) => {
    this.setOwnValue(name as any, newValue, true)
  }


  /**
   * Make full ordered object including keys from bottom layers
   * @private
   */
  private makeFullOrderedObject(): Record<string, any> {
    const res: Record<string, any> = {}

    for (const key of this.allKeys) res[key] = this._values[key]

    return res
  }

}
