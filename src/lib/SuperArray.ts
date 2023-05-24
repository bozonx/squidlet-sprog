import {arrayKeys, getClassPublicMembers, removeSomeItemsFromArray} from 'squidlet-lib';
import {isSuperValue, SUPER_VALUE_PROP, SuperValueBase} from './SuperValueBase.js';
import {SuperScope} from '../scope.js';
import {AllTypes} from '../types/valueTypes.js';
import {isCorrespondingType} from './isCorrespondingType.js';
import {
  DEFAULT_INIT_SUPER_DEFINITION, SuperItemDefinition,
  SuperItemInitDefinition
} from '../types/SuperItemDefinition.js';


const ARR_PUBLIC_MEMBERS = [
  'superValue',
  // 'scope',
  // 'isInitialized',
  // 'parent',
  // 'pathToMe',
  'myKeys',
  'hasKey',
  'getValue',
  'setValue',
  'resetValue',
  // 'link',
  // 'clone',
  // 'detachedCopy',

  'isArray',
  //'itemDefinition',
  //'defaultArray',
  'readOnly',
  'length',
  //'setOwnValue',
  'clearItem',
  'toDefaultValue',
  'deleteItem',

  // mutate array
  'push',
  'pop',
  'shift',
  'unshift',
  'fill',
  'splice',
  'reverse',
  'sort',
]


export function proxyArray(arr: SuperArray): any[] {
  const handler: ProxyHandler<any[]> = {
    get(target: any[], prop: any) {
      if (ARR_PUBLIC_MEMBERS.indexOf(prop) === -1) {
        // some other prop
        const index = Number(prop)

        if (Number.isInteger(index)) {
          if (index < 0) {
            // Support negative indices (e.g., -1 for last element)
            prop = String(arr.length + index)
          }

          return arr.values[prop]
        }
        // some other prop - get it from the array
        return arr.values[prop]
      }
      else {
        // public SuperArray prop
        return (arr as any)[prop]
      }
    },
    set(target: any[], prop, value) {
      // Intercept array element assignment
      //console.log('set', prop, value)

      // TODO: push method set value and set length - do it need to catch length set???

      const index = Number(prop);
      if (Number.isInteger(index)) {
        if (index < 0) {
          // Support negative indices (e.g., -1 for last element)
          prop = String(target.length + index);
        }
        target[index] = value;
      } else {
        // Set the usual array properties and methods
        target[index] = value;
      }

      return true
    },
    // apply(target: any[], thisArg: any, argArray: any[]): any {
    //   console.log(111, target, thisArg, argArray)
    // }
  }

  const a: any = []
  //const a: any = arr.values
  //
  // a[SUPER_VALUE_PROP] = arr

  // TODO: поидее надо заменить вообще все методы, особенно мутирующие
  //   чтобы поднимать события


  // const publicMembers: string[] = removeSomeItemsFromArray(
  //   getClassPublicMembers(arr),
  //   [
  //   // TODO: а чо всмысле???
  //   'length',
  //   // TODO: надо переименовать
  //   'keys',
  //     ]
  // )


  for (const memberName of ARR_PUBLIC_MEMBERS) {
    //a.__proto__[memberName] = (arr as any)[memberName]
  }


  // a.__proto__.init = arr.init
  // a.__proto__.destroy = arr.destroy
  // a.__proto__.hasKey = arr.hasKey
  // a.__proto__.getValue = arr.getValue
  // a.__proto__.setValue = arr.setValue
  // a.__proto__.resetValue = arr.resetValue
  // a.__proto__.clone = arr.clone
  // a.__proto__.link = arr.link

  //return new Proxy(a, handler)

  return new Proxy(a, handler)
}


export class SuperArray<T = any> extends SuperValueBase<T[]> {
  readonly isArray = true
  // definition for all the items of array
  readonly itemDefinition: SuperItemDefinition
  readonly values: T[] = []
  readonly defaultArray?: any[]


  get readOnly(): boolean {
    return Boolean(this.itemDefinition.readonly)
  }

  get length(): number {
    return this.values.length
  }


  constructor(
    scope: SuperScope,
    itemDefinition?: SuperItemInitDefinition,
    defaultArray?: any[]
  ) {
    super(scope)

    this.itemDefinition = {
      ...(itemDefinition || DEFAULT_INIT_SUPER_DEFINITION),
      required: Boolean(itemDefinition?.required),
      readonly: Boolean(itemDefinition?.readonly),
    }
    this.defaultArray = defaultArray
  }


  /**
   * Init with initial values.
   * It returns setter for readonly params
   */
  init = (initialArr?: T[]): ((index: number, item: AllTypes) => void) => {
    if (this.inited) {
      throw new Error(`The array has been already initialized`)
    }
    // set initial values
    const initArrLength = initialArr?.length || 0
    const defaultArrLength = this.defaultArray?.length || 0
    const maxLength: number = Math.max(initArrLength, defaultArrLength)
    const indexArr = (new Array(maxLength)).fill(true)
    // Any way set length to remove odd items. Actually init is allowed to run only once
    // so there should aren't any initialized super values in the rest of array
    this.values.length = maxLength

    indexArr.forEach((el: true, index: number) => {
      // if index is in range of initalArr then get its item otherwise get from defaultArray
      const value = (index < initArrLength)
        ? initialArr?.[index]
        : this.defaultArray?.[index]

      this.values[index] = this.initChild(
        this.itemDefinition,
        index,
        value
      )
    })

    return super.init()
  }

  destroy = () => {
    super.destroy()

    const values: any[] = this.values

    for (const indexStr of values) {
      if (isSuperValue(values[indexStr])) (values[indexStr] as SuperValueBase).destroy()
    }
  }


  myKeys(): number[] {
    return arrayKeys(this.values)
  }

  setOwnValue(key: string | number, value: AllTypes, ignoreRo: boolean = false) {
    const index = Number(key)

    if (!ignoreRo && this.readOnly) {
      throw new Error(`Can't set a value to readonly array`)
    }
    else if (!isCorrespondingType(value, this.itemDefinition.type)) {
      throw new Error(
        `The value of index ${index} is not corresponding to array type ${this.itemDefinition.type}`
      )
    }

    this.values[index] = value as T

    this.riseChildrenChangeEvent(index)
  }

  /**
   * Clear item in array but not remove index
   * clearItem(1) [0,1,2] will be [0, empty, 2]
   * getting of arr[1] will return undefined
   * @param index
   */
  clearItem(index: number) {
    if (this.readOnly) {
      throw new Error(`Can't delete item from readonly array`)
    }

    delete this.values[index]

    this.riseChildrenChangeEvent(index)
  }

  toDefaultValue(index: number) {
    // TODO: add
  }

  /**
   * Delete item and splice an array
   * deleteItem(1) [0,1,2] will be [0,2]
   * @param index
   * @param ignoreRo
   */
  deleteItem(index: number, ignoreRo: boolean = false) {
    if (!ignoreRo && this.readOnly) {
      throw new Error(`Can't delete item from readonly array`)
    }
    // TODO: test
    this.values.splice(index)
    this.riseChildrenChangeEvent(index)
  }

  makeProxy(): T[] {
    // TODO: add
    // TODO: навеное пометить что получение значений должно тогда всегда выдаваться с proxy
    return []
  }


  ////// Standard methods
  // Methods which are mutate an array: push, pop, shift, unshift, fill, splice, reverse, sort

  push = (...items: any[]): number => {
    //const prevLength = this.values.length
    const newLength = this.values.push(...items)
    // const arr = (new Array(newLength - prevLength)).fill(true)
    //
    // // TODO: test
    // // rise events for all the new children
    // arr.forEach((el: true, index: number) => this.riseChildrenChangeEvent(index))
    //

    // TODO: наверное надо инициализировать super value и проверить значения

    // emit event for whole array
    this.riseMyEvent()

    return newLength
  }

  pop() {
    //const lastIndex = this.values.length - 1
    const res = this.values.pop()

    //this.riseChildrenChangeEvent(lastIndex)
    // emit event for whole array
    this.riseMyEvent()

    // TODO: нужно овязять super элемент и дестроить его

    return res
  }

  shift() {
    const res = this.values.shift()

    //this.riseChildrenChangeEvent(0)
    // emit event for whole array
    this.riseMyEvent()

    // TODO: нужно овязять super элемент и дестроить его

    return res
  }

  unshift(...items: any[]) {
    const res = this.values.unshift(...items)
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

  fill(value: any, start?: number, end?: number) {
    this.values.fill(value, start, end)
    // emit event for whole array
    this.riseMyEvent()

    // TODO: наверное надо проверить значения

    return this
  }

  splice(start: number, deleteCount: number, ...items: T[]) {
    const res = this.values.splice(start, deleteCount, ...items)
    // emit event for whole array
    this.riseMyEvent()

    // TODO: нужно овязять super элемент и дестроить его

    return res
  }

  reverse() {
    const res = this.values.reverse()
    // emit event for whole array
    this.riseMyEvent()

    return res
  }

  sort(compareFn?: (a: T, b: T) => number) {
    this.values.sort()
    // emit event for whole array
    this.riseMyEvent()

    return this
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

    // TODO: для массива то получается ro не полноценный
    //       нужно не только менять потомка но и сам массив - push, splice etc

    this.setOwnValue(index, newValue, true)
    this.riseChildrenChangeEvent(index)
  }

}
