import {arrayKeys, omitObj, lastItem, fillWithNumberIncrement} from 'squidlet-lib';
import {
  SUPER_VALUE_PROXY_PUBLIC_MEMBERS,
  SUPER_VALUE_EVENTS,
  SuperValueBase,
  SuperValuePublic
} from './SuperValueBase.js';
import {
  DEFAULT_INIT_SUPER_DEFINITION,
  SuperItemDefinition,
} from '../types/SuperItemDefinition.js';
import {AllTypes} from '../types/valueTypes.js';
import {checkArrayDefinition, isSuperValue, SUPER_VALUE_PROP} from './superValueHelpers.js';
import {SuperScope} from './scope.js';


export interface SuperArrayDefinition extends Omit<SuperItemDefinition, 'required'> {
  // 'default' means default value of each item of array will be this value
  // default array value. It overrides default
  defaultArray?: any[]
}

export interface SuperArrayPublic extends SuperValuePublic {
  isArray: boolean
  isReadOnly: boolean
  length: number
  clearIndex(index: number): void
  clearValue(value: any): void
  deleteIndex(index: number): void
  deleteValue(value: any): void
  move(keyToMove: number, newPosition: number): boolean
  onArrayChange(handler: () => void): number

  // standard array mutable methods
  push(...items: any[]): number
  pop(): any | undefined
  shift(): any | undefined
  unshift(...items: any[]): number
  fill(value: any, start?: number, end?: number): ProxyfiedArray
  splice(start: number, deleteCount: number, ...items: any[]): any[]
  reverse(): any[]
  sort(): ProxyfiedArray

  // standard array non mutable methods
  concat: Array<any>['concat']
  // copyWithin()
  entries: Array<any>['entries']
  every: Array<any>['every']
  filter: Array<any>['filter']
  find: Array<any>['find']
  findIndex: Array<any>['findIndex']
  findLast: Array<any>['findLast']
  findLastIndex: Array<any>['findLastIndex']
  flat: Array<any>['flat']
  flatMap: Array<any>['flatMap']
  forEach: Array<any>['forEach']
  includes: Array<any>['includes']
  indexOf: Array<any>['indexOf']
  join: Array<any>['join']
  keys: Array<any>['keys']
  lastIndexOf: Array<any>['lastIndexOf']
  map: Array<any>['map']
  slice: Array<any>['slice']
  toLocaleString: Array<any>['toLocaleString']
  toString: Array<any>['toString']
  values: Array<any>['values']
  valueOf: Array<any>['valueOf']
  some: Array<any>['some']
  reduce: Array<any>['reduce']
  reduceRight: Array<any>['reduceRight']
}

export type ProxyfiedArray<T = any> = SuperArrayPublic
  & {$super: SuperArray}
  & Array<T>

const ARR_PUBLIC_MEMBERS = [
  ...SUPER_VALUE_PROXY_PUBLIC_MEMBERS,

  'isArray',
  'isReadOnly',
  'length',
  'clearIndex',
  'clearValue',
  'deleteIndex',
  'deleteValue',
  'move',
  'onArrayChange',

  // standard array mutable methods
  'push',
  'pop',
  'shift',
  'unshift',
  'fill',
  'splice',
  'reverse',
  'sort',

  // standard array non mutable methods
  'concat',
  // copyWithin()
  'entries',
  'every',
  'filter',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'flat',
  'flatMap',
  'forEach',
  'includes',
  'indexOf',
  'join',
  'keys',
  'lastIndexOf',
  'map',
  'slice',
  'toLocaleString',
  'toString',
  'values',
  'valueOf',
  'some',
  'reduce',
  'reduceRight',
]


/**
 * Wrapper for super array which allows to manipulate it as common array.
 * And it puts some methods to it:
 * * arr.$super - instance of SuperArray
 * * arr. ... - see other methods in ARR_PUBLIC_MEMBERS
 * @param arr
 */
export function proxifyArray(arr: SuperArray): ProxyfiedArray {
  const handler: ProxyHandler<any[]> = {
    get(target: any[], prop: string | symbol) {
      // $super
      if (prop === SUPER_VALUE_PROP) return arr
      else if (typeof prop === 'string' && ARR_PUBLIC_MEMBERS.includes(prop)) {
        // public SuperArray prop
        return (arr as any)[prop]
      }
      // symbol or index or prop of Array() class
      return arr.allValues[prop as any]
    },

    has(target: any, prop: string): boolean {
      if (prop === SUPER_VALUE_PROP || ARR_PUBLIC_MEMBERS.includes(prop)) return true

      return typeof arr.allValues[prop as any] !== 'undefined'
    },

    set(target: any[], prop, value) {
      // Intercept array element assignment
      const index = Number(prop)

      if (Number.isInteger(index)) {
        // set value and rise an event
        return arr.setOwnValue(index, value)
      }

      throw new Error(`It isn't allow to change Array() members`)
    },

    deleteProperty(target: any, prop: string): boolean {
      throw new Error(
        `Don't delete via value proxy! User clearItem() or deleteItem() instead`
      )
    },

  }

  return new Proxy(arr.allValues, handler) as ProxyfiedArray
}


export class SuperArray<T = any>
  extends SuperValueBase<T[]>
  implements SuperArrayPublic
{
  readonly isArray = true
  protected _values: T[] = []
  protected proxyFn = proxifyArray
  // definition for all the items of array
  private readonly definition: SuperArrayDefinition

  get isReadOnly(): boolean {
    return Boolean(this.definition.readonly)
  }

  get length(): number {
    return this.allValues.length
  }

  get allKeys(): number[] {
    return arrayKeys(this.allValues)
  }


  constructor(
    definition?: Partial<SuperArrayDefinition>,
    defaultRo: boolean = false,
  ) {
    super()

    checkArrayDefinition(definition)

    this.definition = {
      ...omitObj(DEFAULT_INIT_SUPER_DEFINITION, 'required'),
      ...definition,
      readonly: (typeof definition?.readonly === 'undefined')
        ? defaultRo
        : definition.readonly
    } as SuperArrayDefinition
  }

  /**
   * Init with initial values.
   * It returns setter for readonly params
   */
  init = (initialArr?: T[]): ((index: number, item: AllTypes) => void) => {
    if (this.inited) throw new Error(`The array has been already initialized`)

    this.events.emit(SUPER_VALUE_EVENTS.initStart)

    // set initial values
    const initArrLength = initialArr?.length || 0
    const defaultArrLength = this.definition.defaultArray?.length || 0
    const maxLength: number = Math.max(initArrLength, defaultArrLength)
    // Any way set length to remove odd items. Actually init is allowed to run only once
    // so there should aren't any initialized super values in the rest of array
    this._values.length = maxLength

    for (const itemIndex of (new Array(maxLength)).keys()) {
      // if index is in range of initalArr then get its item
      // otherwise get from defaultArray
      const value = (itemIndex < initArrLength)
        ? initialArr?.[itemIndex]
        : this.definition.defaultArray?.[itemIndex]
      const childDefinition = this.getDefinition(itemIndex)

      this._values[itemIndex] = this.resolveChildValue(childDefinition, itemIndex, value)
    }

    return super.init()
  }

  destroy = () => {
    super.destroy()

    const values: any[] = this.allValues

    for (const indexStr of values) {
      if (isSuperValue(values[indexStr])) {
        (values[indexStr][SUPER_VALUE_PROP] as SuperValueBase).destroy()
      }
    }
  }


  getOwnValue(key: number): AllTypes {
    return super.getOwnValue(key)
  }

  setOwnValue(keyStr: number, value: AllTypes, ignoreRo: boolean = false): boolean {
    return super.setOwnValue(Number(keyStr), value, ignoreRo)
  }

  getProxy(): ProxyfiedArray<T> {
    return super.getProxy()
  }

  /**
   * It converts SuperArray definition to SuperItemDefinition
   * @param index
   */
  getDefinition(index: number): SuperItemDefinition {
    return {
      type: this.definition.type,
      default: (this.definition.defaultArray)
        ? this.definition.defaultArray[index]
        : this.definition.default,
      readonly: this.definition.readonly,
      nullable: this.definition.nullable,
      required: false,
    }
  }

  batchSet(values?: T[]) {
    if (!values) return

    for (const key of values.keys()) {
      this.setOwnValue(key, (values as any[])[key])
    }
  }

  async execute(
    scope: SuperScope,
    values: any[],
    roSetter?: (name: string, value: any) => void
  ) {
    if (!Array.isArray(values)) return

    return super.execute(scope, values, roSetter)
  }

  ///// Array specific methods

  /**
   * Clear item in array by index but not remove index
   * clearItem(1) [0,1,2] will be [0, empty, 2]
   * getting of arr[1] will return undefined
   * @param index
   */
  clearIndex = (index: number) => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (this.isReadOnly) {
      throw new Error(`Can't delete item from readonly array`)
    }

    delete this._values[index]

    this.emitChildChangeEvent(index)
  }

  /**
   * Clear item in array by value but not remove index
   * clearItem(1) [0,1,2] will be [0, empty, 2]
   * getting of arr[1] will return undefined
   * @param value
   */
  clearValue = (value: any) => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (this.isReadOnly) {
      throw new Error(`Can't delete item from readonly array`)
    }

    const index = this.allValues.indexOf(value)

    if (index < 0) return

    delete this._values[index]

    this.emitChildChangeEvent(index)
  }

  /**
   * Delete item and splice an array
   * deleteItem(1) [0,1,2] will be [0,2]
   * @param index
   */
  deleteIndex = (index: number) => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (this.isReadOnly) {
      throw new Error(`Can't delete item from readonly array`)
    }

    this._values.splice(index, 1)
    this.emitChildChangeEvent(index)
  }

  /**
   * Delete item and splice an array
   * deleteItem(1) [0,1,2] will be [0,2]
   * @param value
   */
  deleteValue = (value: any) => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (this.isReadOnly) {
      throw new Error(`Can't delete item from readonly array`)
    }

    const index = this.allValues.indexOf(value)

    if (index < 0) return

    this._values.splice(index, 1)

    this.emitChildChangeEvent(index)
  }

  move = (keyToMove: number, newPosition: number): boolean => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    if (keyToMove < 0 || keyToMove > this.allValues.length - 1) return false
    else if (newPosition < 0 || newPosition > this.allValues.length - 1) return false
    else if (keyToMove === newPosition) return false

    const valueToMove = this.allValues[keyToMove]
    const oldValue = this.allValues[newPosition]

    this._values[newPosition] = valueToMove
    this._values[keyToMove] = oldValue

    this.events.emit(
      SUPER_VALUE_EVENTS.moved,
      this, this.pathToMe,
      [valueToMove, oldValue],
      [keyToMove, newPosition]
    )
    // emit event for whole array
    this.emitMyEvent()

    return true
  }

  /**
   * Listen only to add, remove or reorder array changes.
   * It listens to only this array not children bubbles
   */
  onArrayChange(handler: () => void): number {
    return this.events.addListener(SUPER_VALUE_EVENTS.change, (el: any, path?: string) => {
      if (el === this && path === this.myPath) handler()
    })
  }


  ////// Standard methods
  // Methods which are mutate an array:
  // push, pop, shift, unshift, fill, splice, reverse, sort

  push = (...items: any[]): number => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const addedKeys: number[] = fillWithNumberIncrement(this.allValues.length, items.length)

    for (const key of items.keys()) {
      this.validateItem(addedKeys[key], items[key])
    }

    const newLength = this._values.push(...items)

    for (const item of items) {
      // TODO: если передан super value
      //    надо подменить у него parent, path и слушать buble событий от него
      //    все его потомки должны обновить родительский path
    }

    this.events.emit(SUPER_VALUE_EVENTS.added, this, this.pathToMe, items, addedKeys)
    // emit change event for whole array.
    // This means any change of array order - add, remove and move
    this.emitMyEvent()

    return newLength
  }

  pop = () => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const prevLength = this.allValues.length
    const removedEl = lastItem(this.allValues)
    const res = this._values.pop()

    // TODO: нужно овязять super элемент и дестроить его

    this.events.emit(SUPER_VALUE_EVENTS.removed, this, this.pathToMe, [removedEl], [prevLength - 1])
    // emit event for whole array
    this.emitMyEvent()

    return res
  }

  shift = () => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const removedEl = this.allValues[0]
    const res = this._values.shift()

    // TODO: нужно овязять super элемент и дестроить его

    this.events.emit(SUPER_VALUE_EVENTS.removed, this, this.pathToMe, [removedEl], [0])
    // emit event for whole array
    this.emitMyEvent()

    return res
  }

  unshift = (...items: any[]): number => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    for (const key of items.keys()) {
      this.validateItem(items[key], items[key])
    }

    const addedKeys: number[] = arrayKeys(items)
    const res = this._values.unshift(...items)

    // TODO: наверное надо инициализировать super value и проверить значения

    this.events.emit(SUPER_VALUE_EVENTS.added, this, this.pathToMe, items, addedKeys)
    // emit event for whole array
    this.emitMyEvent()

    return res
  }

  /**
   * End can't be greater than length
   * the index of End will be not set, the last filled value will be end - 1
   * @param value
   * @param start
   * @param end
   */
  fill = (value: any, start?: number, end?: number): ProxyfiedArray => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    this.validateItem(start || 0, value)

    // TODO: запретить super либо их подвязать к себе

    this._values.fill(value, start, end)
    // emit events for all the changed children
    for (
      let i = start || 0;
      i < (
        (typeof end === 'undefined' || end > this.allValues.length - 1)
          ? this.allValues.length
          : end
      );
      i++
    ) {
      this.emitChildChangeEvent(i)
    }

    return this.proxyfiedInstance
  }

  splice = (start: number = 0, deleteCount: number = 0, ...items: T[]) => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    // TODO: чо за items ???

    const removedKeys: number[] = fillWithNumberIncrement(
      start,
      (start + deleteCount > this.allValues.length)
        ? this.allValues.length - start
        : deleteCount
    )
    const removedItems = this._values.splice(start, deleteCount, ...items)

    if (removedItems.length) {
      this.events.emit(SUPER_VALUE_EVENTS.removed, this, this.pathToMe, removedItems, removedKeys)
      // emit event for whole array
      this.emitMyEvent()
    }

    // TODO: нужно овязять super элемент и дестроить его

    return removedItems
  }

  reverse = () => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const res = this._values.reverse()
    this.events.emit(SUPER_VALUE_EVENTS.moved, this, this.pathToMe, res, arrayKeys(res))
    // emit event for whole array
    this.emitMyEvent()

    return res
  }

  sort = (compareFn?: (a: T, b: T) => number): ProxyfiedArray => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const prevArr = [...this.allValues]

    this._values.sort(compareFn)

    const changedValues: any[] = []
    const changedKeys: any[] = []

    for (const key of this.allValues.keys()) {
      if (this.allValues[key] !== prevArr[key]) {
        changedValues.push(this.allValues[key])
        changedKeys.push(key)
      }
    }

    if (changedValues.length) {
      this.events.emit(
        SUPER_VALUE_EVENTS.moved,
        this,
        this.pathToMe,
        changedValues,
        changedKeys,
      )
      // emit event for whole array
      this.emitMyEvent()
    }

    return this.proxyfiedInstance
  }

  /*
   * Not mutate array methods: concat, copyWithin, entries, every, filter,
   *   find, findIndex, findLast, findLastIndex, flat, flatMap, forEach,
   *   includes, indexOf, join, keys, lastIndexOf, map, slice, toLocaleString,
   *   toString, values, valueOf, some, reduce, reduceRight
   */

  concat = this.allValues.concat
  entries = this.allValues.entries
  every = this.allValues.every
  filter = this.allValues.filter
  find = this.allValues.find
  findIndex = this.allValues.findIndex
  findLast = this.allValues.findLast
  findLastIndex = this.allValues.findLastIndex
  flat = this.allValues.flat
  flatMap = this.allValues.flatMap
  forEach = this.allValues.forEach
  includes = this.allValues.includes
  indexOf = this.allValues.indexOf
  join = this.allValues.join
  keys = this.allValues.keys
  lastIndexOf = this.allValues.lastIndexOf
  map = this.allValues.map
  slice = this.allValues.slice
  toLocaleString = this.allValues.toLocaleString
  toString = this.allValues.toString
  reduce = this.allValues.reduce
  reduceRight = this.allValues.reduceRight
  some = this.allValues.some
  valueOf = this.allValues.valueOf
  values = this.allValues.values


  ///// PRIVATE

  /**
   * Set value of self readonly value and rise an event
   */
  protected myRoSetter = (index: number, newValue: AllTypes) => {
    this.setOwnValue(index, newValue, true)
  }

}
