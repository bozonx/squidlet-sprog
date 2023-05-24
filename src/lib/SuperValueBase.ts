import {
  IndexedEvents,
  trimCharStart,
  deepGet,
  deepHas,
  deepSet,
  deepClone,
  omitObj,
  splitDeepPath
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
  changeEvent = new IndexedEvents<SuperChangeHandler>()
  readonly scope: SuperScope
  // parent super struct or array who owns me
  protected myParent?: SuperValueBase
  // Path to myself in upper tree. The last part is my name
  protected myPath?: string
  protected inited: boolean = false


  get isInitialized(): boolean {
    return this.inited
  }

  get parent(): SuperValueBase | undefined {
    return this.myParent
  }

  get pathToMe(): string | undefined {
    return this.myPath
  }


  protected constructor(scope: SuperScope) {
    this.scope = scope
  }


  init(): any {
    // means that array is completely initiated
    this.inited = true
    // rise an event any way if any values was set or not
    this.changeEvent.emit(this, this.pathToMe)
    // listen to children to bubble their events
    this.startListenChildren()
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
    this.myParent = parent
    this.myPath = myPath
  }


  /**
   * Get own keys or indexes
   */
  abstract myKeys(): string[] | number[]

  /**
   * Set value to own child, not deeper.
   * And rise an event of it child
   * @param key
   * @param value
   * @param ignoreRo
   */
  abstract setOwnValue(key: string | number, value: AllTypes, ignoreRo?: boolean): void

  subscribe(handler: SuperChangeHandler): number {
    return this.changeEvent.addListener(handler)
  }

  unsubscribe(handlerIndex: number) {
    this.changeEvent.removeListener(handlerIndex)
  }

  /**
   * It checks does the last parent or myself has key
   * @param pathTo
   */
  hasKey = (pathTo: string): boolean => {
    return deepHas(this.values as any, pathTo)
  }

  /**
   * You cat deeply get some primitive or other struct or super array.
   * If it is a primitive you can't change its value.
   * To change its value get its parent and set value via parent like: parent.value = 5
   */
  getValue = (pathTo: string): AllTypes | undefined => {
    if (typeof pathTo !== 'string') throw new Error(`path has to be a string`)

    return deepGet(this.values as any, pathTo)
  }

  /**
   * Set value deeply.
   * You can set own value or value of some deep object.
   * Even you can set value to the deepest primitive like: struct.struct.num = 5
   */
  setValue = (pathTo: string, newValue: AllTypes) => {
    if (typeof pathTo !== 'string') throw new Error(`path has to be a string`)

    console.log(1111, pathTo, newValue)

    const splat = splitDeepPath(pathTo)

    if (splat.length === 1) {
      // own value - there splat[0] is number or string
      this.setOwnValue(splat[0], newValue)
    }
    else {
      // deep value
      deepSet(this.values as any, pathTo, newValue)
    }
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

    // TODO: move it to squidlet-lib

    const childKeyStr: string = (typeof childKeyOrIndex === 'number')
      ? `[${childKeyOrIndex}]`
      : `.${childKeyOrIndex}`

    if (this.pathToMe) {
      return this.pathToMe + '.' + childKeyStr
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
    this.changeEvent.emit(this, this.pathToMe)
  }

  // TODO: review
  protected initChild(
    definition: SuperItemDefinition,
    childKeyOrIndex: string | number,
    initialValue?: any
  ): any {

    // TODO: read only должно наследоваться потомками если оно стоит у родителя

    // TODO: если потомок super value то надо делать его через proxy
    //       потому что иначе не сработает deepGet, deepSet etc
    //       хотя можно для deep manipulate сделать поддержку методов setValue(), getValue()

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

  /**
   * listen to children to bubble their events
   * @protected
   */
  protected startListenChildren() {
    for (const key of this.myKeys()) {
      const value: SuperValueBase = (this.values as any)[key]

      if (typeof value !== 'object' || value.superValue) continue

      value.subscribe((target: SuperValueBase, path?: string) => {
        // if not path then it's some wierd
        if (!path) console.warn(`Bubble event without path. Root is "${this.pathToMe}", child is "${key}"`)
        // just bubble children's event
        this.changeEvent.emit(target, path)
      })
    }
  }

}
