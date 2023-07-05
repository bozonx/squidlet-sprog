import {arrayKeys, omitObj} from 'squidlet-lib';
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

  push(...items: any[]): number
  pop(): any | undefined
  shift(): any | undefined
  unshift(...items: any[]): number
  fill(value: any, start?: number, end?: number): ProxyfiedArray
  splice(start: number, deleteCount: number, ...items: any[]): any[]
  reverse(): any[]
  sort(): ProxyfiedArray

  // TODO: а остальные не мутабл методы???
}

export type ProxyfiedArray<T = any> = SuperArrayPublic
  & {$super: SuperArray}
  & Array<T>


const ARR_PUBLIC_MEMBERS = [
  ...SUPER_VALUE_PROXY_PUBLIC_MEMBERS,

  'isArray',
  'isReadOnly',
  'length',
  'clearItem',
  'deleteItem',

  /////// mutate array
  'push',
  'pop',
  'shift',
  'unshift',
  'fill',
  'splice',
  'reverse',
  'sort',

  // TODO: а остальные не мутабл методы???
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
      return arr.values[prop as any]
    },

    has(target: any, prop: string): boolean {
      if (prop === SUPER_VALUE_PROP || ARR_PUBLIC_MEMBERS.includes(prop)) return true

      return typeof arr.values[prop as any] !== 'undefined'
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

  return new Proxy(arr.values, handler) as ProxyfiedArray
}


export class SuperArray<T = any>
  extends SuperValueBase<T[]>
  implements SuperArrayPublic
{
  readonly isArray = true
  readonly values: T[] = []
  protected proxyFn = proxifyArray
  // definition for all the items of array
  private readonly definition: SuperArrayDefinition

  get isReadOnly(): boolean {
    return Boolean(this.definition.readonly)
  }

  get length(): number {
    return this.values.length
  }

  get allKeys(): number[] {
    return arrayKeys(this.values)
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
    this.values.length = maxLength

    for (const itemIndex of (new Array(maxLength)).keys()) {
      // if index is in range of initalArr then get its item
      // otherwise get from defaultArray
      const value = (itemIndex < initArrLength)
        ? initialArr?.[itemIndex]
        : this.definition.defaultArray?.[itemIndex]
      const childDefinition = this.getDefinition(itemIndex)

      this.values[itemIndex] = this.resolveChildValue(childDefinition, itemIndex, value)
    }

    return super.init()
  }

  destroy = () => {
    super.destroy()

    const values: any[] = this.values

    for (const indexStr of values) {
      if (isSuperValue(values[indexStr])) {
        (values[indexStr][SUPER_VALUE_PROP] as SuperValueBase).destroy()
      }
    }
  }

  setOwnValue(keyStr: string | number, value: AllTypes, ignoreRo: boolean = false): boolean {
    return super.setOwnValue(Number(keyStr), value, ignoreRo)
  }

  getProxy(): ProxyfiedArray<T> {
    return super.getProxy()
  }

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
   * Listen only to add, remove or reorder array changes
   */
  onArrayChange(handler: () => void): number {
    return this.events.addListener(SUPER_VALUE_EVENTS.change, (el: any, path?: string) => {
      if (el === this && path === this.myPath) handler()
    })
  }

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

    delete this.values[index]

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

    const index = this.values.indexOf(value)

    if (index < 0) return

    delete this.values[index]

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

    this.values.splice(index, 1)
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

    const index = this.values.indexOf(value)

    if (index < 0) return

    this.values.splice(index, 1)

    this.emitChildChangeEvent(index)
  }


  ////// Standard methods
  // Methods which are mutate an array: push, pop, shift, unshift, fill, splice, reverse, sort

  push = (...items: any[]): number => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    const newLength = this.values.push(...items)

    for (const item of items) {
      // TODO: если передан super value
      //    надо подменить у него parent, path и слушать buble событий от него
      //    все его потомки должны обновить родительский path

    }

    // emit event for whole array
    this.emitMyEvent()

    return newLength
  }

  pop = () => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    //const lastIndex = this.values.length - 1
    const res = this.values.pop()

    //this.emitChildChangeEvent(lastIndex)
    // emit event for whole array
    this.emitMyEvent()

    // TODO: нужно овязять super элемент и дестроить его

    return res
  }

  shift = () => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const res = this.values.shift()

    //this.emitChildChangeEvent(0)
    // emit event for whole array
    this.emitMyEvent()

    // TODO: нужно овязять super элемент и дестроить его

    return res
  }

  unshift = (...items: any[]) => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const res = this.values.unshift(...items)
    // emit event for whole array
    this.emitMyEvent()

    // const arr = (new Array(items.length)).fill(true)
    //
    // // TODO: test
    // // rise events for all the new children
    // arr.forEach((el: true, index: number) => this.emitChildChangeEvent(index))

    // TODO: наверное надо инициализировать super value и проверить значения

    return res
  }

  fill = (value: any, start?: number, end?: number): ProxyfiedArray => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    this.values.fill(value, start, end)
    // emit event for whole array
    this.emitMyEvent()

    // TODO: наверное надо проверить значения

    return this.proxyfiedInstance
  }

  splice = (start: number, deleteCount: number, ...items: T[]) => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const res = this.values.splice(start, deleteCount, ...items)
    // emit event for whole array
    this.emitMyEvent()

    // TODO: нужно овязять super элемент и дестроить его

    return res
  }

  reverse = () => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const res = this.values.reverse()
    // emit event for whole array
    this.emitMyEvent()

    return res
  }

  sort = (compareFn?: (a: T, b: T) => number): ProxyfiedArray => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    this.values.sort(compareFn)
    // emit event for whole array
    this.emitMyEvent()

    return this.proxyfiedInstance
  }

  // TODO: not mutable methods just copy:
  //  - filter
  //  - find
  //  - findIndex
  //  - findLast
  //  - findLastIndex
  //  - forEach
  //  - includes
  //  - indexOf
  //  - join
  //  - map
  //  - slice
  //  - toLocaleString
  //  - toString
  //  - reduce
  //  - reduceRight
  //  ???? flat, flatMap, keys, values, some, valueOf
  // not realize: concat, copyWithin, entries, every

/*
 * Not mutate array methods: concat, copyWithin, entries, every, filter,
 *   find, findIndex, findLast, findLastIndex, flat, flatMap, forEach,
 *   includes, indexOf, join, keys, lastIndexOf, map, slice, toLocaleString,
 *   toString, values, valueOf, some, reduce, reduceRight
 */

  ///// PRIVATE

  /**
   * Set value of self readonly value and rise an event
   */
  protected myRoSetter = (index: number, newValue: AllTypes) => {
    this.setOwnValue(index, newValue, true)
  }

}
