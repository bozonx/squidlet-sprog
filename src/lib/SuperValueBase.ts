import {
  IndexedEvents,
  deepGet,
  deepHas,
  deepSet,
  deepClone,
  omitObj,
  splitDeepPath,
  joinDeepPath
} from 'squidlet-lib';
import {SuperScope} from '../scope.js';
import {AllTypes, SIMPLE_TYPES, SimpleType, SUPER_TYPES, SUPER_VALUES} from '../types/valueTypes.js';
import {SuperItemDefinition} from '../types/SuperItemDefinition.js';
import {isCorrespondingType} from './isCorrespondingType.js';
import {resolveInitialSimpleValue} from './helpers.js';


export interface SuperValuePublic {
  isSuperValue: boolean
  getValue(pathTo: string): AllTypes | undefined
  setValue(pathTo: string, newValue: AllTypes): void
  setNull(pathTo: string): void
  toDefaultValue(key: string | number): void
}

export interface SuperLinkItem {
  // not proxyfied struct or array
  externalSuperValue: SuperValueBase
  // name of key of their child which is linked to mine
  externalKey: string | number
  // name or key of my child which is linked to their
  myKey: string | number
  // handler id of their events
  externalHandlerIndex: number
  // handler id of my events
  myHandlerIndex: number
}

export const SUPER_PROXY_PUBLIC_MEMBERS = [
  'isSuperValue',
  'getValue',
  'setValue',
  'setNull',
  'toDefaultValue',
  'subscribe',
]


export type SuperChangeHandler = (
  // link to element which is changed. It can be a parent or its child
  target: SuperValueBase,
  // path to child element which is changed. If '' then it is parent
  // if it is undefined then means any element of root was changed
  path?: string
) => void

export const SUPER_VALUE_PROP = '$super'

export function isSuperValue(val: any): boolean {
  return typeof val === 'object' && val.isSuperValue
}


export abstract class SuperValueBase<T = any | any[]> implements SuperValuePublic {
  readonly isSuperValue = true
  readonly abstract values: T
  changeEvent = new IndexedEvents<SuperChangeHandler>()
  protected proxyfiedInstance?: any
  // parent super struct or array who owns me
  protected myParent?: SuperValueBase
  // Path to myself in upper tree. The last part is my name
  protected myPath?: string
  protected inited: boolean = false
  protected links: SuperLinkItem[] = []
  protected abstract proxyFn: (instance: any) => any
  private myScope: SuperScope


  get scope(): SuperScope {
    return this.myScope
  }

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
    this.myScope = scope
  }


  init(): any {
    // means that array is completely initiated
    this.inited = true
    // rise an event any way if any values was set or not
    this.changeEvent.emit(this, this.pathToMe)
    // listen to children to bubble their events
    this.startListenChildren()


    // TODO: ещё же надо вызвать init() потомков

    // return setter for read only props
    return this.myRoSetter
  }

  destroy() {
    for (const linkId in this.links) {
      // actually empty is also undefined
      if (typeof linkId === 'undefined') continue

      this.unlink(Number(linkId))
    }

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
   * Do it only if you are totally sure what you do.
   * @param scope
   */
  $$replaceScope(scope: SuperScope) {
    this.myScope = scope
  }


  abstract isKeyReadonly(key: string | number): boolean

  /**
   * Get own keys or indexes
   */
  abstract myKeys(): string[] | number[]

  abstract getOwnValue(key: string | number): AllTypes

  /**
   * Set value to own child, not deeper.
   * And rise an event of it child
   * @param key
   * @param value
   * @param ignoreRo
   */
  abstract setOwnValue(key: string | number, value: AllTypes, ignoreRo?: boolean): void

  abstract toDefaultValue(key: string | number): void

  /**
   * Return proxy of my self and make it if it is the first time
   */
  getProxy(): any | any[] {
    if (!this.proxyfiedInstance) {
      this.proxyfiedInstance = this.proxyFn(this)
    }

    return this.proxyfiedInstance
  }

  subscribe = (handler: SuperChangeHandler): number => {
    return this.changeEvent.addListener(handler)
  }

  unsubscribe = (handlerIndex: number) => {
    this.changeEvent.removeListener(handlerIndex)
  }

  /**
   * It checks does the last parent or myself has key
   * @param pathTo
   */
  hasKey = (pathTo: string): boolean => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return deepHas(this.values as any, pathTo)
  }

  /**
   * You cat deeply get some primitive or other struct or super array.
   * If it is a primitive you can't change its value.
   * To change its value get its parent and set value via parent like: parent.value = 5
   */
  getValue = (pathTo: string): AllTypes | undefined => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (typeof pathTo !== 'string') throw new Error(`path has to be a string`)

    return deepGet(this.values as any, pathTo)
  }

  /**
   * Set value deeply.
   * You can set own value or value of some deep object.
   * Even you can set value to the deepest primitive like: struct.struct.num = 5
   */
  setValue = (pathTo: string, newValue: AllTypes) => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (typeof pathTo !== 'string') throw new Error(`path has to be a string`)

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
  setNull = (pathTo: string) => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    this.setValue(pathTo, null)
  }

  // TODO: review - нужно учитывать что тот элемент может задестроиться
  // TODO: если задестроится external элемент то у нас ещё link останется - это плохо
  //       тогда либо надо проверять в событии живой ли элемент
  //       либо слушать событие дестроя
  /**
   * Link key of some struct or array to key of this.
   * Both values of these keys will change at the same time and rise change events both
   */
  link = (
    externalSuperValue: SuperValueBase,
    externalKey: string | number,
    myKey: string | number
  ): number => {
    const linkId = this.links.length
    const externalKeyPath = externalSuperValue.makeChildPath(externalKey)
    const myKeyPath = this.makeChildPath(myKey)
    const link = {
      externalSuperValue,
      externalKey,
      myKey,
      externalHandlerIndex: -1,
      myHandlerIndex: -1,
    }
    const externalVal = externalSuperValue.getOwnValue(externalKey)

    // synchronize values wright now before subscribing to events
    if (this.getOwnValue(myKey) !== externalVal) this.setOwnValue(myKey, externalVal)
    // subscribe to external change event to set the same value to my
    if (!this.isKeyReadonly(myKey)) {
      link.externalHandlerIndex = externalSuperValue.subscribe((
        target: SuperValueBase,
        path: string = ''
      ) => {
        if (externalKeyPath !== path) return

        this.setOwnValue(myKey, externalSuperValue.getOwnValue(externalKey))
      })
    }
    // subscribe to my change event to set the same value to external struct or array
    if (!externalSuperValue.isKeyReadonly(externalKey)) {
      link.myHandlerIndex = this.subscribe((
        target: SuperValueBase,
        path: string = ''
      ) => {
        if (myKeyPath !== path) return

        this.setOwnValue(externalKey, this.getOwnValue(myKey))
      })
    }

    if (link.externalHandlerIndex === -1 && link.myHandlerIndex === -1) {
      console.warn(`Both linked keys are readonly: ${myKey}, ${externalKey}`)
    }

    this.links.push(link)

    return linkId
  }

  unlink(linkId: number) {
    const link = this.links[linkId]

    if (!link) return

    if (link.externalHandlerIndex >= 0) {
      link.externalSuperValue.unsubscribe(link.externalHandlerIndex)
    }

    if (link.myHandlerIndex >= 0) {
      this.unsubscribe(link.myHandlerIndex)
    }

    delete this.links[linkId]
  }

  /**
   * It makes full deep clone.
   * You can change the clone but changes will not affect the struct.
   */
  clone = (): T => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return deepClone(omitObj(this.values as any, SUPER_VALUE_PROP))
  }

  detachedCopy() {
    // TODO: копирование себя, но без родителя и его пути
    //  и со сброшенными обработчиками событий
    //  поидее потомков надо тоже отсоединить от дерева и присоединить к себе
  }

  makeChildPath(childKeyOrIndex: string | number): string {
    return joinDeepPath([this.pathToMe, childKeyOrIndex])
  }


  /**
   * This method will be returned after initializing to update readonly values
   * @protected
   */
  protected abstract myRoSetter: Function

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

  /**
   * Setup child value.
   * It the value is primitive then it checks its type and returns default or initial value
   * If the child is Super Struct or Array
   */
  protected setupChildValue(
    definition: SuperItemDefinition,
    childKeyOrIndex: string | number,
    initialValue?: any
  ): any {
    if (Object.keys(SUPER_VALUES).includes(definition.type)) {
      return this.setupSuperChild(definition, childKeyOrIndex, initialValue)
    }
    else if (definition.type === SUPER_TYPES.SuperFunc) {
      // super function
      // TODO: do it
    }

    // TODO: обычная ф-я ???
    // TODO: инстанс класса ???

    else if (Object.keys(SIMPLE_TYPES).includes(definition.type)) {
      return this.setupSimpleChild(definition, childKeyOrIndex, initialValue)
    }
    else {
      throw new Error(`Not supported type as super value child: ${definition.type}`)
    }

    throw new Error(`Can't setup a value of ${childKeyOrIndex}`)
  }

  /**
   * listen to children to bubble their events
   * @protected
   */
  protected startListenChildren() {
    for (const key of this.myKeys()) {
      const value: SuperValueBase = (this.values as any)[key]

      if (typeof value !== 'object' || !value.isSuperValue) continue

      value.subscribe((target: SuperValueBase, path?: string) => {
        // if not path then it's some wierd
        if (!path) console.warn(`Bubble event without path. But root is "${this.pathToMe}", child is "${key}"`)
        // just bubble children's event
        this.changeEvent.emit(target, path)
      })
    }
  }


  /**
   * It checks and resolve initial value
   */
  private setupSimpleChild(
    definition: SuperItemDefinition,
    childKeyOrIndex: string | number,
    initialValue?: any
  ): SimpleType {
    // use initial value of default if no initial value
    const value = (typeof initialValue === 'undefined')
      ? definition.default
      : initialValue

    if (typeof value === 'undefined' && definition.required) {
      throw new Error(`The value of ${childKeyOrIndex} is required, but hasn't defined`)
    }
    else if (typeof value === 'undefined' && !definition.required) {
      // return null if nullable or initial value for each type
      // e.g string='', number=0, boolean=false etc
      return resolveInitialSimpleValue(
        definition.type as keyof typeof SIMPLE_TYPES,
        definition.nullable
      )
    }
    // Value is defined in this case don't check required.
    // Check type
    else if (!isCorrespondingType(value, definition.type, definition.nullable)) {
      throw new Error(
        `The value of ${childKeyOrIndex} has type ${typeof value}, `
        + `but not ${definition.type}`
      )
    }

    return value
  }

  // TODO: review
  private setupSuperChild(
    definition: SuperItemDefinition,
    childKeyOrIndex: string | number,
    initialValue?: any
  ): SuperValueBase {
    // work with super type

    if (initialValue && isSuperValue(initialValue)) {
      // this means the super struct or array has already initialized,
      // so now we are linking it as my child

      // TODO: проверить соответствие в default's definition
      // TODO: установить ro если он у родителя
      // TODO: потомок должен установить ro у детей

      initialValue.$$setParent(this, this.makeChildPath(childKeyOrIndex))

      return initialValue
    }
    else if (!definition.default) {
      throw new Error(`There aren't initial value and default value for super value`)
    }
    else if (typeof definition.default !== 'object') {
      throw new Error(`Wrong type of definition.default`)
    }
    else {
      // if initial value not defined then create an instance using default's definition

      // TODO: read only должно наследоваться потомками если оно стоит у родителя

      // TODO: если потомок super value то надо делать его через proxy
      //       потому что иначе не сработает deepGet, deepSet etc
      //       хотя можно для deep manipulate сделать поддержку методов setValue(), getValue()

      let def

      if (definition.type === SUPER_VALUES.SuperStruct) {
        def = {
          $exp: 'newSuperStruct',
          definition: definition.default,
          defaultRo: definition.readonly,
        }
      }
      else if (definition.type === SUPER_VALUES.SuperArray) {
        def = {
          $exp: 'newSuperArray',
          item: {
            ...definition.default.item,
            //readonly: definition.readonly
          },
          default: definition.default.default,
        }
      }

      //this.myScope.$resolve()
    }

    throw new Error(`Can't setup a super value of ${childKeyOrIndex}`)
  }

}
