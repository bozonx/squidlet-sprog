import {SuperValueBase} from '../lib/SuperValueBase.js';
import {SuperScope} from '../scope.js';
import {AllTypes} from './valueTypes.js';


export function proxyArray(arr: SuperArray): any[] {
  const handler: ProxyHandler<any[]> = {
    get(target: any[], prop: any) {
      //console.log('get', prop)
      // Intercept array element access
      const index = Number(prop);
      if (Number.isInteger(index)) {
        if (index < 0) {
          // Support negative indices (e.g., -1 for last element)
          prop = String(target.length + index);
        }
        return target[prop];
      }

      // Return the usual array properties and methods
      return target[prop];
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
  }

  const a = (arr.values as any)

  a.__proto__.init = arr.init
  a.__proto__.destroy = arr.destroy
  a.__proto__.has = arr.has
  a.__proto__.getValue = arr.getValue
  a.__proto__.setValue = arr.setValue
  a.__proto__.resetValue = arr.resetValue
  a.__proto__.clone = arr.clone
  a.__proto__.link = arr.link

  return new Proxy(a, handler)
}


/*
 * Not mutate array methods: length (only prop), concat, copyWithin, entries, every, filter,
 *   find, findIndex, findLast, findLastIndex, flat, flatMap, forEach,
 *   includes, indexOf, join, keys, lastIndexOf, map, slice, toLocaleString,
 *   toString, values, valueOf, some, reduce, reduceRight
 *
 * Methods which are mutate an array: push, pop, shift, unshift, fill, splice, reverse, sort
 *
 */


export class SuperArray<T = any> extends SuperValueBase {
  readonly values: any[] = []
  readonly itemType: AllTypes


  constructor(scope: SuperScope, itemType: AllTypes = 'any') {
    super(scope)

    this.itemType = itemType
  }


  /**
   * Init with initial values.
   * It returns setter for readonly params
   */
  init = (initialArr?: T[]): ((index: number, item: AllTypes) => void) => {
    // TODO: return setter for ro array

    if (this.inited) {
      throw new Error(`The array has been already initialized`)
    }


    return super.init()
  }

  destroy = () => {
    super.destroy()

    // TODO: destroy children
  }


  has = () => {
    // TODO: deeply
  }

  getValue = (pathTo: string | number): any => {
    // TODO: deeply
    return this.arr[Number(pathTo)]
  }

  setValue = () => {
    // TODO: deeply
  }

  resetValue = () => {
    // TODO: deeply
  }

  clone = (): T => {
    return [] as T
  }

  link = () => {

  }


  /**
   * Set value of self readonly value and rise an event
   */
  private myRoSetter = (index: number, item: AllTypes) => {

  }

  ////// Standart methods
  // push = (item: any): number => {
  //   console.log(4444)
  //   return this.arr.push(item)
  // }
  //
  // pop() {
  //
  // }
  //
  // shift() {
  //
  // }
  //
  // unshift() {
  //
  // }
  //
  // fill() {
  //
  // }
  //
  // splice() {
  //
  // }
  //
  // reverse() {
  //
  // }
  //
  // sort() {
  //
  // }

  ////// PRIVATE

}


// const a = new SuperArray({} as any, {} as any)
//
// const b = proxyArray(a)
//
// b[0] = 5
//
// console.log(444, (b as any).getValue(0))
//
// b.push(6)
