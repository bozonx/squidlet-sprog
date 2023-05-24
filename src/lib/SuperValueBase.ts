import {
  IndexedEvents,
  trimCharStart,
  deepGet,
  deepHas,
  deepClone,
  omitObj
} from 'squidlet-lib';
import {SuperScope} from '../scope.js';
import {AllTypes} from '../types/valueTypes.js';
import {SuperItemDefinition} from '../types/SuperItemDefinition.js';
import {isCorrespondingType} from './isCorrespondingType.js';


export type SuperChangeHandler = (
  // link to element which is changed. It can be a parent or its child
  target: SuperValueBase,
  // path to child element which is changed. If '' then it is parent
  // if it is undefined then means any element of root was changed
  path?: string
) => void

export const SUPER_VALUE_PROP = '$super'

export function isSuperValue(val: any): boolean {
  return typeof val === 'object' && val.superValue
}


export abstract class SuperValueBase<T = any | any[]> {
  readonly superValue = true
  readonly abstract values: T
  // parent super struct or array who owns me
  protected parent?: SuperValueBase
  // Path to myself in upper tree. The last part is my name
  protected myPath?: string
  protected changeEvent = new IndexedEvents<SuperChangeHandler>()
  protected inited: boolean = false
  protected scope: SuperScope


  get isInitialized(): boolean {
    return this.inited
  }


  protected constructor(scope: SuperScope) {
    this.scope = scope
  }


  init(): any {
    // means that array is completely initiated
    this.inited = true
    // rise an event any way if any values was set or not
    this.changeEvent.emit(this, this.myPath)
    // return setter for read only props
    return this.myRoSetter
  }

  destroy() {
    this.changeEvent.destroy()
  }

  /**
   * It is called only when parent set this item as its child
   * @parent - parent super struct or super array
   * @myPath - full path to me in tree where im is
   */
  $$setParent(parent: SuperValueBase, myPath: string) {
    this.parent = parent
    this.myPath = myPath
  }


  abstract keys(): string[] | number[]

  /**
   * Set value to own child, not deeper
   * @param key
   * @param value
   * @param ignoreRo
   */
  abstract setOwnValue(key: string | number, value: AllTypes, ignoreRo: boolean): void

  subscribe(handler: SuperChangeHandler): number {
    return this.changeEvent.addListener(handler)
  }

  unsubscribe(handlerIndex: number) {
    this.changeEvent.removeListener(handlerIndex)
  }

  has = (pathTo: string): boolean => {
    return deepHas(this.values as any, pathTo)
  }

  /**
   * You cat deeply get some primitive or other struct or super array.
   * If it is a primitive you can't change its value.
   * To change its value get its parent and set value via parent like: parent.value = 5
   */
  getValue = (pathTo: string): AllTypes | undefined => {
    return deepGet(this.values as any, pathTo)
  }

  /**
   * Set value deeply.
   * You can set own value or value of some deep object.
   * Even you can set value to the deepest primitive like: struct.struct.num = 5
   */
  setValue = (pathTo: string, newValue: AllTypes) => {
    // TODO: add
    // TODO: нужно ставить значение примитива через родителя
    // TODO: use readonly

    // TODO: а если массив?
    if (pathTo.indexOf('.') === -1) {
      // own value
      this.safeSetOwnValue(pathTo as keyof T, value)
    }
    else {
      // deep value
      deepSet(this.values as any, pathTo, value)
    }

    // rise an event only if it is my children and it isn't a super value
    // super value will rise an event by itself
    // // TODO: простые типы могут быть deeply
    // if (
    //   pathTo.indexOf('.') === -1
    //   typeof this.definition[pathTo] === 'undefined'
    //   && !isSuperValue(this.values[pathTo])
    // ) {
    //   this.riseChildrenChangeEvent(pathTo as keyof T)
    // }
  }

  /**
   * The same as setValue but it sets null
   */
  resetValue = (pathTo: string) => {
    this.setValue(pathTo, null)
  }

  link = () => {
    // TODO: прилинковать значения разных struct, array или primitive
    //       чтобы эти значения менялись одновременно
  }

  /**
   * It makes full deep clone.
   * You can change the clone but changes will not affect the struct.
   */
  clone = (): T => {
    return deepClone(omitObj(this.values as any, SUPER_VALUE_PROP))
  }

  detachedCopy() {
    // TODO: копирование себя, но без родителя и его пути
    //  и со сброшенными обработчиками событий
    //  поидее потомков надо тоже отсоединить от дерева и присоединить к себе
    // TODO: add to proxy
  }

  /**
   * This method will be returned after initializing to update readonly values
   * @protected
   */
  protected abstract myRoSetter: Function

  protected makeChildPath(childKeyOrIndex: string | number): string {
    const childKeyStr: string = (typeof childKeyOrIndex === 'number')
      ? `[${childKeyOrIndex}]`
      : `.${childKeyOrIndex}`

    if (this.myPath) {
      return this.myPath + '.' + childKeyStr
    }
    else {
      return trimCharStart(childKeyStr, '.')
    }
  }

  protected riseChildrenChangeEvent(childKeyOrIndex: string | number) {
    const fullPath = this.makeChildPath(childKeyOrIndex)

    this.changeEvent.emit(this, fullPath)
  }

  /**
   * Rise an event of whole my instance
   * @protected
   */
  protected riseMyEvent() {
    this.changeEvent.emit(this, this.myPath)
  }

  // TODO: review
  protected initChild(
    definition: SuperItemDefinition,
    childKeyOrIndex: string | number,
    initialValue?: any
  ): any {

    // TODO: read only должно наследоваться потомками если оно стоит у родителя

    let result: any | undefined

    if (typeof initialValue === 'undefined') {
      // if no new value then set default value if exist
      result = definition.default

      // TODO: тут тоже проверить тип, он может быть не верный

      // TODO: if definition of child is super struct or array
      //       and not initial value - then make a new super instance
    }
    else {
      // set a new value. It doesn't mean is it readonly or not
      if (isCorrespondingType(initialValue, definition.type)) {
        result = initialValue
      }
      else {
        throw new Error(
          `The initial value ${initialValue} with key ${childKeyOrIndex} ` +
          `is not corresponding type ${definition.type}`
        )
      }

      if (isSuperValue(result)) {
        // this means the super struct or array has already initialized,
        // so now we are linking it as my child
        const superVal: SuperValueBase<T> = result

        superVal.$$setParent(this, this.makeChildPath(childKeyOrIndex))
      }
    }

    return result
  }

}
