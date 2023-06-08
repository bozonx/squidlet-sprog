import {arrayKeys, spliceItem, omitObj} from 'squidlet-lib';
import {
  SUPER_PROXY_PUBLIC_MEMBERS, SUPER_VALUE_EVENTS,
  SUPER_VALUE_PROP,
  SuperValueBase,
  SuperValuePublic
} from './SuperValueBase.js';
import {SuperScope} from './scope.js';
import {All_TYPES, AllTypes, SIMPLE_TYPES} from '../types/valueTypes.js';
import {isCorrespondingType} from './isCorrespondingType.js';
import {
  DEFAULT_INIT_SUPER_DEFINITION,
  SuperItemDefinition,
} from '../types/SuperItemDefinition.js';
import {resolveInitialSimpleValue} from './helpers.js';



// TODO: наверное в default запретить пока super value



export interface SuperArrayDefinition extends Omit<SuperItemDefinition, 'required'> {
  // 'default' means default value of each item of array will be this value
  // default array value. It overrides default
  defaultArray?: any[]
}

export interface SuperArrayPublic extends SuperValuePublic {
  isArray: boolean
  isReadOnly: boolean
  length: number
  clearItem(index: number): void
  deleteItem(index: number, ignoreRo?: boolean): void

  push(...items: any[]): number
  pop(): any | undefined
  shift(): any | undefined
  unshift(...items: any[]): number
  fill(value: any, start?: number, end?: number): ProxyfiedArray
  splice(start: number, deleteCount: number, ...items: any[]): any[]
  reverse(): any[]
  sort(): ProxyfiedArray
}

export type ProxyfiedArray<T = any> = SuperArrayPublic
  & {$super: SuperArray}
  & Array<T>


const ARR_PUBLIC_MEMBERS = [
  ...SUPER_PROXY_PUBLIC_MEMBERS,

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
]


/**
 * Wrapper for super array which allows to manipulate it as common array.
 * And it puts some methods to it:
 * * arr.$super - instance of SuperArray
 * * arr... - see other methods in ARR_PUBLIC_MEMBERS
 * @param arr
 */
export function proxyArray(arr: SuperArray): ProxyfiedArray {
  const handler: ProxyHandler<any[]> = {
    get(target: any[], prop: string | symbol) {
      if (prop === SUPER_VALUE_PROP) {
        return arr
      }
      else if (typeof prop === 'string' && ARR_PUBLIC_MEMBERS.includes(prop)) {
        // public SuperArray prop
        return (arr as any)[prop]
      }
      else {
        // some other prop
        if (typeof prop === 'symbol') {
          return arr.ownValues[prop as  any]
        }
        else {
          // means number as string
          const index = Number(prop)

          if (Number.isInteger(index)) {
            if (index < 0) {
              // Support negative indices (e.g., -1 for last element)
              prop = String(arr.length + index)
            }

            return arr.ownValues[index]
          }
          // some other prop - get it from the array
          return arr.ownValues[prop as any]
        }
      }
    },
    set(target: any[], prop, value) {
      // Intercept array element assignment
      const index = Number(prop);

      if (Number.isInteger(index)) {
        if (index < 0) {
          // Support negative indices (e.g., -1 for last element)
          prop = String(arr.length + index);
        }
        // set value and rise an event
        arr.setOwnValue(index, value)
      } else {
        // Set the usual array properties and methods
        arr.ownValues[index] = value
      }

      return true
    },
  }

  return new Proxy(arr.ownValues, handler) as ProxyfiedArray
}


export class SuperArray<T = any> extends SuperValueBase<T[]> implements SuperArrayPublic {
  readonly isArray = true
  // definition for all the items of array
  readonly definition: SuperArrayDefinition
  readonly ownValues: T[] = []
  //protected readonly layeredValues: T[]
  protected proxyFn = proxyArray


  get isReadOnly(): boolean {
    return Boolean(this.definition.readonly)
  }

  get length(): number {
    return this.ownValues.length
  }

  get itemDefinition(): SuperItemDefinition {
    return { ...this.definition, required: false }
  }

  get layeredValues(): any {
    return this.ownValues
  }

  get ownKeys(): number[] {
    return arrayKeys(this.ownValues)
  }


  constructor(definition: Partial<SuperArrayDefinition>) {
    super()

    this.checkDefinition(definition)

    this.definition = {
      ...omitObj(DEFAULT_INIT_SUPER_DEFINITION, 'required'),
      ...definition,
    } as SuperArrayDefinition
  }

  /**
   * Init with initial values.
   * It returns setter for readonly params
   */
  init = (initialArr?: T[]): ((index: number, item: AllTypes) => void) => {
    if (this.inited) {
      throw new Error(`The array has been already initialized`)
    }

    this.events.emit(SUPER_VALUE_EVENTS.initStart)

    // set initial values
    const initArrLength = initialArr?.length || 0
    const defaultArrLength = this.definition.defaultArray?.length || 0
    const maxLength: number = Math.max(initArrLength, defaultArrLength)
    const indexArr = (new Array(maxLength)).fill(true)
    // Any way set length to remove odd items. Actually init is allowed to run only once
    // so there should aren't any initialized super values in the rest of array
    this.ownValues.length = maxLength

    indexArr.forEach((el: true, index: number) => {
      // if index is in range of initalArr then get its item otherwise get from defaultArray
      const value = (index < initArrLength)
        ? initialArr?.[index]
        : this.definition.defaultArray?.[index]
      const childDefinition: SuperItemDefinition = {
        type: this.definition.type,
        default: (this.definition.defaultArray)
          ? this.definition.defaultArray[index]
          : this.definition.default,
        readonly: this.definition.readonly,
        nullable: this.definition.nullable,
        required: false,
      }

      this.ownValues[index] = this.resolveChildValue(childDefinition, index, value)
    })

    return super.init()
  }

  destroy = () => {
    super.destroy()

    const values: any[] = this.ownValues

    for (const indexStr of values) {
      if (typeof values[indexStr] === 'object' && values[indexStr].destroy) {
        (values[indexStr] as SuperValueBase).destroy()
      }
    }
  }


  /**
   * Listen only to add, remove or reorder array changes
   */
  onArrayChange(handler: () => void): number {
    return this.events.addListener(SUPER_VALUE_EVENTS.change, (el: any) => {
      if (el === this) handler()
    })
  }

  isKeyReadonly(key: string | number): boolean {
    return this.isReadOnly
  }

  getOwnValue(key: number): AllTypes {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return this.ownValues[key] as any
  }

  setOwnValue(key: string | number, value: AllTypes, ignoreRo: boolean = false): boolean {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const index = Number(key)

    this.ownValues[index] = this.resolveChildValue(this.itemDefinition, index, value)

    this.riseChildrenChangeEvent(index)

    return true
  }

  /**
   * Set default value of array or undefined if there isn't any default value
   * @param index
   */
  toDefaultValue = (index: number) => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    let defaultValue = (this.definition.defaultArray)
      ? this.definition.defaultArray[index]
      : this.definition.default

    // TODO: а если super type??? То надо вызвать default value у него ???
    //       или ничего не делать? Если менять заного то надо дестроить предыдущий

    if (
      Object.keys(SIMPLE_TYPES).includes(this.definition.type)
      && typeof defaultValue === 'undefined'
    ) {
      defaultValue = resolveInitialSimpleValue(
        this.definition.type as keyof typeof SIMPLE_TYPES,
        this.definition.nullable
      )
    }

    this.setOwnValue(index, defaultValue)
  }

  getProxy(): ProxyfiedArray<T> {
    return super.getProxy()
  }

  ///// Array specific methods
  /**
   * Clear item in array but not remove index
   * clearItem(1) [0,1,2] will be [0, empty, 2]
   * getting of arr[1] will return undefined
   * @param index
   */
  clearItem = (index: number) => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (this.isReadOnly) {
      throw new Error(`Can't delete item from readonly array`)
    }

    delete this.ownValues[index]

    this.riseChildrenChangeEvent(index)
  }

  /**
   * Delete item and splice an array
   * deleteItem(1) [0,1,2] will be [0,2]
   * @param index
   * @param ignoreRo
   */
  deleteItem = (index: number, ignoreRo: boolean = false) => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (!ignoreRo && this.isReadOnly) {
      throw new Error(`Can't delete item from readonly array`)
    }

    // TODO: в тестах не учавствует
    spliceItem(this.ownValues, index)
    this.riseChildrenChangeEvent(index)
  }

  getDefinition(key: string): SuperItemDefinition | undefined {
    return this.definition as SuperItemDefinition
  }


  ////// Standard methods
  // Methods which are mutate an array: push, pop, shift, unshift, fill, splice, reverse, sort

  push = (...items: any[]): number => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    const newLength = this.ownValues.push(...items)

    for (const item of items) {
      // TODO: если передан super value
      //    надо подменить у него parent, path и слушать buble событий от него
      //    все его потомки должны обновить родительский path

    }

    // emit event for whole array
    this.riseMyEvent()

    return newLength
  }

  pop = () => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    //const lastIndex = this.ownValues.length - 1
    const res = this.ownValues.pop()

    //this.riseChildrenChangeEvent(lastIndex)
    // emit event for whole array
    this.riseMyEvent()

    // TODO: нужно овязять super элемент и дестроить его

    return res
  }

  shift = () => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const res = this.ownValues.shift()

    //this.riseChildrenChangeEvent(0)
    // emit event for whole array
    this.riseMyEvent()

    // TODO: нужно овязять super элемент и дестроить его

    return res
  }

  unshift = (...items: any[]) => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const res = this.ownValues.unshift(...items)
    // emit event for whole array
    this.riseMyEvent()

    // const arr = (new Array(items.length)).fill(true)
    //
    // // TODO: test
    // // rise events for all the new children
    // arr.forEach((el: true, index: number) => this.riseChildrenChangeEvent(index))

    // TODO: наверное надо инициализировать super value и проверить значения

    return res
  }

  fill = (value: any, start?: number, end?: number): ProxyfiedArray => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    this.ownValues.fill(value, start, end)
    // emit event for whole array
    this.riseMyEvent()

    // TODO: наверное надо проверить значения

    return this.proxyfiedInstance
  }

  splice = (start: number, deleteCount: number, ...items: T[]) => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const res = this.ownValues.splice(start, deleteCount, ...items)
    // emit event for whole array
    this.riseMyEvent()

    // TODO: нужно овязять super элемент и дестроить его

    return res
  }

  reverse = () => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    const res = this.ownValues.reverse()
    // emit event for whole array
    this.riseMyEvent()

    return res
  }

  sort = (compareFn?: (a: T, b: T) => number): ProxyfiedArray => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    this.ownValues.sort(compareFn)
    // emit event for whole array
    this.riseMyEvent()

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


  private checkDefinition(definition: Partial<SuperArrayDefinition>) {
    const {
      type,
      default: defaultValue,
      defaultArray,
      nullable,
      readonly,
    } = definition

    if (type && !Object.keys(All_TYPES).includes(type)) {
      throw new Error(`Wrong type of SuperArray child: ${type}`)
    }
    else if (typeof nullable !== 'undefined' && typeof nullable !== 'boolean') {
      throw new Error(`nullable has to be boolean`)
    }
    else if (typeof readonly !== 'undefined' && typeof readonly !== 'boolean') {
      throw new Error(`readonly has to be boolean`)
    }
    else if (defaultValue && !isCorrespondingType(defaultValue, type, nullable)) {
      throw new Error(
        `Default value ${defaultValue} of SuperArray doesn't meet type: ${type}`
      )
    }
    else if (defaultArray) {
      if (!Array.isArray(defaultArray)) {
        throw new Error(`defaultArray has to be an array`)
      }
      else if (
        defaultArray.findIndex((el) => !isCorrespondingType(el, type, nullable)) >= 0
      ) {
        throw new Error(`wrong defaultArray`)
      }
    }
  }

}
