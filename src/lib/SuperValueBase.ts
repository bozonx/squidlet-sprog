import {
  IndexedEventEmitter,
  deepGet,
  deepHas,
  deepClone,
  splitDeepPath,
  joinDeepPath,
  deepGetParent,
} from 'squidlet-lib';
import {
  AllTypes,
  ProxifiedSuperValue,
  SimpleType,
  SUPER_VALUES
} from '../types/valueTypes.js';
import {SuperItemDefinition} from '../types/SuperItemDefinition.js';
import {SuperBase} from './SuperBase.js';
import {
  resolveNotSuperChild,
  SUPER_VALUE_PROP,
  validateChildValue,
  isSuperValue, checkValueBeforeSet
} from './superValueHelpers.js';


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

export enum SUPER_VALUE_EVENTS {
  initStart,
  inited,
  destroy,
  change,
  // changes (define or forget) of definitions after initialization
  definition,
  newLink,
  unlink,
  changeParent,
}


export type SuperChangeHandler = (
  // link to element which is changed. It can be a parent or its child
  target: ProxifiedSuperValue,
  // path to child element which is changed. If '' then it is parent
  // if it is undefined then means any element of root was changed
  path?: string
) => void


export abstract class SuperValueBase<T = any | any[]>
  extends SuperBase
  implements SuperValuePublic
{
  readonly isSuperValue = true
  // current values
  readonly abstract values: T
  readonly events = new IndexedEventEmitter()
  protected links: SuperLinkItem[] = []
  // like {childKeyOrIndex: {eventNum: handlerIndex}}
  private childEventHandlers: Record<string, Record<string, number>> = {}

  get isDestroyed(): boolean {
    return this.events.isDestroyed
  }

  /**
   * Get all the keys or indexes
   */
  abstract allKeys: (string | number)[]


  init(): any {
    super.init()
    // rise an event any way if any values was set or not
    this.events.emit(SUPER_VALUE_EVENTS.change, this, this.pathToMe)
    this.events.emit(SUPER_VALUE_EVENTS.inited)
    // return setter for read only props
    return this.myRoSetter
  }

  destroy() {

    // TODO: запретить дестрой если нарушится целостность у родителя - required, struct

    this.events.emit(SUPER_VALUE_EVENTS.destroy)

    for (const linkId in this.links) {
      // actually empty is also undefined
      if (typeof linkId === 'undefined') continue

      this.unlink(Number(linkId))
    }

    for (const itemKey of this.allKeys) {
      this.removeChildListeners(itemKey)
    }

    this.events.destroy()
  }

  /**
   * It is called only when parent set this item as its child
   * @parent - parent super struct, super array or super data
   * @myPath - full path to me in tree where im am
   */
  $$setParent(parent: SuperValueBase, myPath: string) {
    super.$$setParent(parent, myPath)

    // TODO: если этот же родитель был ранее, то нужно отписаться от событий и заного записаться

    // reregister path of all the super children
    for (const childId of this.allKeys) {
      const item = this.values[childId as keyof T] as SuperBase

      // TODO: если есть full ro у родителя то должен установить ro у детей а те у своих детей
      // TODO: если у нового потомка есть старый родитель, то надо отписаться от него
      // TODO: если отсоединить потомка от другого родителя то у него может
      //       нарушиться целостность, так как он может быть обязательным в struct
      //       или быть required
      //       можно сделать явную проверку и поднять ошибку

      if (item.$$setParent) item.$$setParent(this, this.makeChildPath(childId))
    }

    this.events.emit(SUPER_VALUE_EVENTS.changeParent)
  }


  //abstract isKeyReadonly(key: string | number): boolean

  /**
   * Get only own value not from bottom layer and not deep
   * @param key
   */
  //abstract getOwnValue(key: string | number): AllTypes


  abstract toDefaultValue(key: string | number): void

  abstract getDefinition(key: string | number): SuperItemDefinition | undefined

  subscribe = (handler: SuperChangeHandler): number => {
    return this.events.addListener(SUPER_VALUE_EVENTS.change, handler)
  }

  unsubscribe = (handlerIndex: number) => {
    this.events.removeListener(handlerIndex, SUPER_VALUE_EVENTS.change)
  }

  isKeyReadonly(key: string | number): boolean {
    const def = this.getDefinition(key)

    if (!def) {
      throw new Error(`Struct doesn't have definition of key ${key}`)
    }

    return def.readonly
  }

  /**
   * It checks does the last parent or myself has key
   * @param pathTo
   */
  hasKey = (pathTo: string): boolean => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (typeof pathTo !== 'string') throw new Error(`path has to be a string`)

    return deepHas(this.values as any, pathTo)
  }

  getOwnValue(key: number | string): AllTypes {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return this.values[key as keyof T] as any
  }

  /**
   * Set value to own child, not deeper and not to bottom layer.
   * And rise an event of it child
   * @param key
   * @param value
   * @param ignoreRo
   * @returns {boolean} if true then value was found and set. If false value hasn't been set
   */
  //abstract setOwnValue(key: string | number, value: AllTypes, ignoreRo?: boolean): boolean

  setOwnValue(key: string | number, value: AllTypes, ignoreRo: boolean = false): boolean {
    const def = this.getDefinition(key)

    checkValueBeforeSet(this.isInitialized, def, key, value, ignoreRo)
    // value will be validated inside resolveChildValue
    this.values[key as keyof T] = this.resolveChildValue(def!, key, value)

    this.emitChildChangeEvent(key)

    return true
  }

  /**
   * You cat deeply get some primitive or other struct or super array.
   * If it is a primitive you can't change its value.
   * To change its value get its parent and set value via parent like: parent.value = 5
   */
  getValue = (pathTo: string, defaultValue?: any): AllTypes | undefined => {

    // TODO: remove defaultValue

    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (typeof pathTo !== 'string') throw new Error(`path has to be a string`)

    return deepGet(this.values as any, pathTo, defaultValue)
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

    if (splat.length === 1) {
      // own value - there splat[0] is number or string
      return this.setOwnValue(splat[0], newValue)
    }
    else {
      // deep value
      return this.setDeepChild(pathTo, newValue)
    }
  }

  /**
   * The same as setValue but it sets null
   */
  setNull = (pathTo: string) => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    this.setValue(pathTo, null)
  }

  /**
   * Set all the values to default ones
   */
  toDefaults() {
    for (const key of this.allKeys) {
      this.toDefaultValue(key)
    }
  }

  // TODO: test
  batchSet(values?: T) {
    if (!values) return

    for (const key of Object.keys(values)) {
      this.setOwnValue(key, (values as any)[key])
    }
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

    // TODO: если личного значения нет то направить на слой ниже

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

    this.events.emit(SUPER_VALUE_EVENTS.newLink, linkId)

    return linkId
  }

  unlink(linkId: number) {

    // TODO: если личного значения нет то направить на слой ниже

    const link = this.links[linkId]

    if (!link) return

    if (link.externalHandlerIndex >= 0) {
      link.externalSuperValue.unsubscribe(link.externalHandlerIndex)
    }

    if (link.myHandlerIndex >= 0) {
      this.unsubscribe(link.myHandlerIndex)
    }

    delete this.links[linkId]

    this.events.emit(SUPER_VALUE_EVENTS.unlink, linkId)
  }

  unlinkByChildKey(childKeyOrIndex: string | number) {
    const linkId = this.links.findIndex((el) => {
      return el.myKey === childKeyOrIndex
    })

    if (linkId >= 0) this.unlink(linkId)
  }

  /**
   * It makes full deep clone.
   * You can change the clone but changes will not affect the struct.
   */
  clone = (): T => {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return deepClone(this.values)
  }

  makeChildPath(childKeyOrIndex: string | number): string {
    return joinDeepPath([this.pathToMe, childKeyOrIndex])
  }


  /**
   * This method will be returned after initializing to update readonly values
   * @protected
   */
  protected abstract myRoSetter: Function

  protected emitChildChangeEvent(childKeyOrIndex: string | number) {
    const fullPath = this.makeChildPath(childKeyOrIndex)

    this.events.emit(SUPER_VALUE_EVENTS.change, this, fullPath)
  }

  /**
   * Rise an event of whole my instance
   * @protected
   */
  protected emitMyEvent() {
    this.events.emit(SUPER_VALUE_EVENTS.change, this, this.pathToMe)
  }

  // TODO: впринципе можно вынести в отдельную ф-ю
  /**
   * Resolve onw child value according the definition and init it.
   * It is called in init(), setOwnValue() and define()
   * @param definition
   * @param childKeyOrIndex
   * @param value - if value not set then it will try to get default value
   *   or make an initial value according to definition.type
   */
  protected resolveChildValue(
    definition: SuperItemDefinition,
    childKeyOrIndex: string | number,
    value?: any
  ): SimpleType | ProxifiedSuperValue | undefined {
    validateChildValue(definition, childKeyOrIndex, value)

    if (Object.keys(SUPER_VALUES).includes(definition.type)) {
      return this.resolveSuperChild(definition, childKeyOrIndex, value)
    }
    else if (
      definition.type === 'any'
      && typeof value === 'object'
      && isSuperValue(value[SUPER_VALUE_PROP])
    ) {
      // if any type and the value is super value - then make it my child
      this.setupSuperChild(value, childKeyOrIndex)

      return value
    }
    // resolve other types
    return resolveNotSuperChild(definition, value)
  }

  /**
   * Set to deep child.
   * * if parent of this child is Super value then call setValue which emits an event
   * * if parent of child is simple array or object - just set value and emit an event
   * @param pathTo - has to be a deep value
   * @param newValue
   * @protected
   */
  protected setDeepChild(pathTo: string, newValue: AllTypes): boolean {
    const [deepParent, lastPathPart] = deepGetParent(this.values as any, pathTo)

    if (typeof lastPathPart === 'undefined') {
      throw new Error(`Can't find deep child`)
    }
    else if (isSuperValue(deepParent)) {
      return deepParent.$super.setValue(lastPathPart, newValue)
    }
    // simple object or array
    deepParent[lastPathPart] = newValue

    this.events.emit(SUPER_VALUE_EVENTS.change, deepParent, pathTo)

    return true
  }


  /**
   * It resolves a super value:
   * * if initialValue set then it returns it
   * * if no initialValue then make a new instance an init it with default value
   * * if no initialValue and default value then just init a new instance
   * @param definition
   * @param childKeyOrIndex
   * @param initialValue
   * @private
   */
  private resolveSuperChild(
    definition: SuperItemDefinition,
    childKeyOrIndex: string | number,
    initialValue?: ProxifiedSuperValue
  ): ProxifiedSuperValue | undefined {
    if (initialValue) {
      if (!initialValue[SUPER_VALUE_PROP]) {
        throw new Error(`child has to be proxified`)
      }
      else if (!isSuperValue(initialValue)) {
        throw new Error(`child is not Super Value`)
      }
      // this means the super value has already initialized
      // so now we are making it my child and start listening of its events
      this.setupSuperChild(initialValue, childKeyOrIndex)

      return initialValue
    }
    else {
      // no initial value - make a new Super Value
      return this.makeNewSuperValueByDefinition(definition, childKeyOrIndex)
    }
  }

  private makeNewSuperValueByDefinition(
    definition: SuperItemDefinition,
    childKeyOrIndex: string | number
  ) {
    const superChildType = definition.type as keyof typeof SUPER_VALUES
    // it doesn't need to set whole RO because it will be set in $$setParent() in setupSuperChild()
    const superChildRo = definition.readonly
    let superChild
    // no initialValue
    if (definition.default) {
      //instantiateSuperValue()
      // there is has to be a defintion setup of child

      // TODO: циклическая зависимость !!!
      // superChild = new SUPER_VALUE_CLASSES[superChildType](
      //   // use default as definition of this value
      //   definition.default,
      //   superChildRo
      // )
    }
    else {
      // if no definition setup of child then just make it without definition
      // only for SuperData and SuperArray
      if (definition.type === SUPER_VALUES.SuperStruct) {
        throw new Error(`Can't create SuperStruct instance without definition for "${childKeyOrIndex}"`)
      }
      // make super child without definition
      // superChild = new SUPER_VALUE_CLASSES[superChildType](
      //   undefined,
      //   superChildRo
      // )
    }

    // this.setupSuperChild(superChild, childKeyOrIndex)
    //
    // superChild.init()
    //
    // return superChild.getProxy()
  }

  /**
   * it:
   * * replace parent
   * * start listen to children to bubble their events
   * * listen to child destroy
   * @protected
   */
  private setupSuperChild(
    child: ProxifiedSuperValue,
    childKeyOrIndex: string | number
  ) {
    child.$super.$$setParent(this, this.makeChildPath(childKeyOrIndex))
    // any way remove my listener if it has
    if (this.childEventHandlers[childKeyOrIndex]) {
      this.removeChildListeners(childKeyOrIndex)
    }

    this.childEventHandlers[childKeyOrIndex] = {
      // bubble child events to me
      [SUPER_VALUE_EVENTS.change]: child.subscribe((target: ProxifiedSuperValue, path?: string) => {
        if (!path) {
          console.warn(`WARNING: Bubbling child event without path. Root is "${this.pathToMe}"`)

          return
        }

        return this.events.emit(SUPER_VALUE_EVENTS.change, target, path)
      }),
      [SUPER_VALUE_EVENTS.destroy]: child.$super.events.addListener(
        SUPER_VALUE_EVENTS.destroy,
        () => this.handleSuperChildDestroy(childKeyOrIndex)
      ),
    }
  }

  private handleSuperChildDestroy(childKeyOrIndex: string | number) {
    this.unlinkByChildKey(childKeyOrIndex)
    this.removeChildListeners(childKeyOrIndex)

    // TODO: его надо удалить из this.values тоже
    //       но тогда останется его definition
    //       и что делать если в definition должен быть потомок если required???
    //       создать заного потомка???
    //       а в struct что делать??? там же потомок обязателен
  }

  /**
   * Remove all the listeners of child
   * @param childKeyOrIndex - it can be a stringified number like '0'
   * @private
   */
  private removeChildListeners(childKeyOrIndex: string | number) {
    const child: ProxifiedSuperValue = (this.values as any)[childKeyOrIndex]

    if (!this.childEventHandlers[childKeyOrIndex] || !child) return

    for (const eventNumStr of Object.keys(this.childEventHandlers[childKeyOrIndex])) {
      const handlerIndex = this.childEventHandlers[childKeyOrIndex][eventNumStr]
      const eventNum = Number(eventNumStr)

      child.$super.events.removeListener(handlerIndex, eventNum)
    }

    delete this.childEventHandlers[childKeyOrIndex]
  }

}
