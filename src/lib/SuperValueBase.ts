import {
  IndexedEventEmitter,
  deepGet,
  deepHas,
  deepClone,
  splitDeepPath,
  joinDeepPath,
  deepGetParent,
  deepFindObj,
  deepMerge
} from 'squidlet-lib';
import {
  AllTypes,
  ProxifiedSuperValue,
  SIMPLE_TYPES,
  SimpleType,
  SUPER_VALUES
} from '../types/valueTypes.js';
import {SuperItemDefinition} from '../types/SuperItemDefinition.js';
import {ProxyfiedSuperBase, SUPER_BASE_PROXY_PUBLIC_MEMBERS, SuperBase, SuperBasePublic} from './SuperBase.js';
import {
  resolveNotSuperChild,
  SUPER_VALUE_PROP,
  validateChildValue,
  isSuperValue,
  checkBeforeSetValue,
  makeNewSuperValueByDefinition,
  isSuperKind
} from './superValueHelpers.js';
import {resolveInitialSimpleValue} from './resolveInitialSimpleValue.js';
import {SuperScope} from './scope.js';


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

export interface SuperValuePublic extends SuperBasePublic {
  isSuperValue: boolean
  getValue(pathTo: string): AllTypes | undefined
  setValue(pathTo: string, newValue: AllTypes): void
  setNull(pathTo: string): void
  subscribe(handler: SuperChangeHandler): number
}

export const SUPER_VALUE_PROXY_PUBLIC_MEMBERS = [
  ...SUPER_BASE_PROXY_PUBLIC_MEMBERS,
  'isSuperValue',
  'getValue',
  'setValue',
  'setNull',
  'subscribe',
]

export enum SUPER_VALUE_EVENTS {
  // at early initialization started
  initStart,
  // initialization has just finished
  inited,
  // destroy has just started
  destroy,
  // any change including array events: added, removed, moved
  change,
  // define or forget of definitions after initialization
  definition,
  newLink,
  unlink,
  // new parent was set
  parentSet,
  // specific array events. for array and data only, not for struct
  // any of these events will be in SUPER_VALUE_EVENTS.change
  // handler of them will receive ([...changedItems], [...changedKeys])
  added,
  removed,
  moved,
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
  readonly events = new IndexedEventEmitter()
  // current values. Keep in mind that there shouldn't be expressions
  protected abstract _values: T
  protected links: SuperLinkItem[] = []
  // like {childKeyOrIndex: {eventNum: handlerIndex}}
  private childEventHandlers: Record<string, Record<string, number>> = {}

  get isDestroyed(): boolean {
    return this.events.isDestroyed
  }

  get allValues(): T {
    return this._values
  }

  /**
   * It strictly gets own values, without layers.
   * By default it is the same as allValues,
   * but in SuperData this method is overwritten
   */
  get ownValuesStrict(): T {
    return this._values
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
    // return setter for readonly props
    return this.myRoSetter
  }

  destroy() {
    if (this.isDestroyed) return

    const myKey = this.myKeyOfParent
    const myDefInParent: SuperItemDefinition | undefined = this.parent
      && this.parent.$super.getDefinition(myKey)

    if (this.parent?.$super.isDestroyed === false && myDefInParent) {
      if (myDefInParent.required) {
        throw new Error(
          `Can't destroy child "${this.myPath}" because it is required on parent`
        )
      }
      else if (!myDefInParent.nullable) {
        throw new Error(
          `Can't destroy child "${this.myPath}" because it is not nullable on parent`
        )
      }
      // else null will be set to parent's value eventually
      // remove listeners of me on my parent
      this.parent.$super.removeChildListeners(myKey!)
    }

    this.events.emit(SUPER_VALUE_EVENTS.destroy)
    // remove links to me
    for (const linkId in this.links) {
      // actually empty is also undefined
      if (typeof linkId === 'undefined') continue

      this.unlink(Number(linkId))
    }

    this.events.destroy()
    // remove me for parent
    if (this.parent?.$super.isDestroyed === false) {
      // as we realized before parent exists and has nullable in definition of me
      // TODO: не правильно работает так как требудет установить значение на
      //       элементе который уже задестроен
      //       возмжно вызов дестроя событий происходит позже
      this.parent.$super.setNull(myKey)
    }

    // removing children listeners actually not need because children will be dstroyed
    //   any way and events emitter will be destroyed too.
    // after that you have to destroy all the your children in override of destroy()
  }

  /**
   * It is called only when parent set this item as its child.
   * It is called only in deep of resolveChildValue() method
   * which is called only in init(). setOwnValue() and define().
   * It doesn't need to validate me in parent because this was made
   * in validateChildValue() before.
   * @parent - parent super struct, super array or super data
   * @myPath - full path to me in tree where im am
   */
  $$setParent(parent: ProxyfiedSuperBase, myPath: string) {
    // register my new parent
    super.$$setParent(parent, myPath)
    // change path of all the super children including bottom layer
    // it doesn't need to set parent because their parent hasn't changed
    for (const childId of this.allKeys) {
      const child = this.allValues[childId as keyof T] as ProxyfiedSuperBase

      if (isSuperKind(child)) {
        child[SUPER_VALUE_PROP].$$setPath(this.makeChildPath(childId))
      }
    }

    this.events.emit(SUPER_VALUE_EVENTS.parentSet)
  }

  // TODO: review
  $$detachChild(childKey: string | number, force: boolean = false) {
    if (!force) {
      const def = this.getDefinition(childKey)

      if (def && (def.required || !def.nullable)) {
        throw new Error(`Can't detach children because of it definition`)
      }
    }

    this.removeChildListeners(childKey)
    // remove me from values
    this.ownValuesStrict[childKey as keyof T] = null as any
  }


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
   * It checks does it have key on given path
   * @param pathTo
   */
  hasKey = (pathTo: string): boolean => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (typeof pathTo !== 'string') throw new Error(`path has to be a string`)

    return deepHas(this.allValues as any, pathTo)
  }

  /**
   * Get only own value not from bottom layer and not deep
   * @param key
   */
  getOwnValue(key: number | string): AllTypes {
    if (!this.isInitialized) throw new Error(`Init it first`)

    return this.allValues[key as keyof T] as any
  }

  /**
   * Set value to own child, not deeper and not to bottom layer.
   * And rise an event of this child
   * @param key
   * @param value
   * @param ignoreRo
   * @returns {boolean} if true then value was found and set. If false value hasn't been set
   */
  setOwnValue(key: string | number, value: AllTypes, ignoreRo: boolean = false): boolean {
    const def = this.getDefinition(key)

    checkBeforeSetValue(this.isInitialized, def, key, ignoreRo)
    // value will be validated inside resolveChildValue
    this._values[key as keyof T] = this.resolveChildValue(def!, key, value)

    this.emitChildChangeEvent(key)

    return true
  }

  /**
   * You can't deeply get some primitive of other struct or super array.
   * If it is a primitive you can't change its value.
   * To change its value get its parent and set value via parent like: parent.value = 5
   */
  getValue = (pathTo: string): AllTypes | undefined => {
    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (typeof pathTo !== 'string' && typeof pathTo !== "symbol") {
      throw new Error(`path has to be a string or symbol`)
    }

    return deepGet(this.allValues as any, pathTo)
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

  /**
   * Set default value if it has "default" in definition.
   * @param key - direct child key where shoud be set a default value
   */
  toDefaultValue(key: string | number) {
    const definition = this.getDefinition(key)

    if (!this.isInitialized) throw new Error(`Init it first`)
    else if (!definition) {
      throw new Error(`Super value doesn't have definition for key "${key}"`)
    }

    // some super types - call toDefaults() on it
    if (isSuperValue(this.allValues[key as keyof T])) {
      (this.allValues[key as keyof T] as {$super: SuperValueBase}).$super.toDefaults()
    }
    else {
      // else all other types including custom ones
      let defaultValue = definition.default

      if (typeof defaultValue === 'undefined') {
        // if no default value then make it from type
        defaultValue = resolveInitialSimpleValue(
          definition.type as keyof typeof SIMPLE_TYPES,
          definition.nullable,
        )
      }
      // set default value to simple child
      this.setOwnValue(key, defaultValue)
      // if doesn't have toDefaults() then do nothing
    }
  }

  batchSet(values?: T) {
    if (!values) return

    for (const key of Object.keys(values)) {
      this.setOwnValue(key, (values as any)[key])
    }
  }

  /**
   * Execute expressions which set in values or set simple value
   * @param scope
   * @param values - expressions of simple values
   * @param roSetter - setter for ro elements
   */
  async execute(
    scope: SuperScope,
    values?: Record<any, any> | any[],
    roSetter?: (name: string, value: any) => void
  ) {
    const valuesToSet = await scope.$calculate(values, true)

    for (const key of Object.keys(valuesToSet)) {
      const fullValue = deepMerge(valuesToSet[key], this.allValues[key as keyof T])
      // set simple value of while deep structure
      if (roSetter) roSetter(key, fullValue)
      else this.setOwnValue(key, fullValue)
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

    return deepClone(this.allValues)
  }

  makeChildPath(childKeyOrIndex: string | number): string {
    return joinDeepPath([this.pathToMe, childKeyOrIndex])
  }

  validateItem(key: string | number, value?: AllTypes, ignoreRo?: boolean) {
    const definition = this.getDefinition(key)

    checkBeforeSetValue(this.isInitialized, definition, key, ignoreRo)
    validateChildValue(definition, key, value)
  }

  // TODO: test
  /**
   * Remove all the listeners of child
   * @param childKeyOrIndex - it can be a stringified number like '0'
   * @private
   */
  removeChildListeners(childKeyOrIndex: string | number) {
    const child: ProxifiedSuperValue = (this.allValues as any)[childKeyOrIndex]

    if (!child || !isSuperValue(child) || !this.childEventHandlers[childKeyOrIndex]) return

    for (const eventNumStr of Object.keys(this.childEventHandlers[childKeyOrIndex])) {
      const handlerIndex = this.childEventHandlers[childKeyOrIndex][eventNumStr]
      const eventNum = Number(eventNumStr)

      child[SUPER_VALUE_PROP].events.removeListener(handlerIndex, eventNum)
    }

    delete this.childEventHandlers[childKeyOrIndex]
  }

  /**
   * It this has some sprog definitions ther it returns true.
   * It checks only structs, arrays and data, not super functions
   */
  hasSuperValueDeepChildren(): boolean {
    // TODO: в массиве если не type: any то все definition одинаковые, нет смысла прохоидстья по всем
    const result = deepFindObj(this.allValues as any | any[], (obj: Record<any, any>) => {
      if (obj[SUPER_VALUE_PROP]) return true
    })

    return Boolean(result)
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

  /**
   * Set to deep child.
   * * if parent of this child is Super value then call setValue which emits an event
   * * if parent of child is simple array or object - just set value and emit an event
   * @param pathTo - has to be a deep value
   * @param newValue
   * @protected
   */
  protected setDeepChild(pathTo: string, newValue: AllTypes): boolean {
    // TODO: нужен ли тут strict ???
    const [deepParent, lastPathPart] = deepGetParent(this.allValues as any, pathTo)

    if (typeof lastPathPart === 'undefined') {
      throw new Error(`Can't find deep child`)
    }
    else if (isSuperValue(deepParent)) {
      return deepParent[SUPER_VALUE_PROP].setValue(lastPathPart, newValue)
    }
    // simple object or array
    deepParent[lastPathPart] = newValue

    this.events.emit(SUPER_VALUE_EVENTS.change, deepParent, pathTo)

    return true
  }

  // TODO: review
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
    // TODO: может быть expression
    // TODO: если SuperFunc - то надо ей сделать $$setParent
    else if (
      definition.type === 'any'
      && value
      && typeof value === 'object'
      && isSuperValue(value[SUPER_VALUE_PROP])
    ) {

      // TODO: почему ???
      // TODO: там же на события навешиваются, которых может не быть у SuperFunc
      // if any type and the value is super value - then make it my child
      this.setupSuperChild(value, childKeyOrIndex)

      return value
    }
    // TODO: review resolveNotSuperChild
    // resolve other types
    return resolveNotSuperChild(definition, value)
  }


  /**
   * It resolves a super value:
   * * if initialValue set then it returns it
   * * if no initialValue then make a new instance an init it with default value
   * * if no initialValue and default value then just init a new instance
   * @param definition
   * @param childKeyOrIndex
   * @param mySuperChild
   * @private
   */
  private resolveSuperChild(
    definition: SuperItemDefinition,
    childKeyOrIndex: string | number,
    mySuperChild?: ProxifiedSuperValue
  ): ProxifiedSuperValue | undefined {
    if (mySuperChild) {
      if (!mySuperChild[SUPER_VALUE_PROP]) {
        throw new Error(`child has to be proxified`)
      }
      else if (!isSuperValue(mySuperChild)) {
        throw new Error(`child is not Super Value`)
      }
      // this means the super value has already initialized
      // so now we are making it my child and start listening of its events
      this.setupSuperChild(mySuperChild, childKeyOrIndex)

      return mySuperChild
    }
    else {
      // TODO: review
      // no initial value - make a new Super Value
      return makeNewSuperValueByDefinition(definition, childKeyOrIndex)
    }
  }

  /**
   * it:
   * * replace parent
   * * start listen to children to bubble their events
   * * listen to child destroy
   * @protected
   */
  private setupSuperChild(mySuperChild: ProxifiedSuperValue, childKeyOrIndex: string | number) {
    //const pathSplat = splitDeepPath(myPath)
    //const myKeyInParent = lastItem(pathSplat)
    //const myDefInParent: SuperItemDefinition | undefined = parent.$super.getDefinition(myKeyInParent)

    // TODO: reivew
    // const prevChild = parent[SUPER_VALUE_PROP].ownValuesStrict[myKeyInParent]
    // // destroy previous child on my place on the new parent
    // if (prevChild && !prevChild[SUPER_VALUE_PROP].isDestroyed) prevChild.$super.destroy()
    //
    // const oldParent = this.parent
    // // detach me from my old parent (or the same)
    // if (oldParent) oldParent[SUPER_VALUE_PROP].$$detachChild(myKeyInParent, true)


    mySuperChild[SUPER_VALUE_PROP].$$setParent(this.getProxy(), this.makeChildPath(childKeyOrIndex))
    // any way remove my listener if it has
    if (this.childEventHandlers[childKeyOrIndex]) {
      this.removeChildListeners(childKeyOrIndex)
    }
    // start listening my children
    this.listenChildEvents(mySuperChild, childKeyOrIndex)
  }

  private handleSuperChildDestroy(childKeyOrIndex: string | number) {
    this.unlinkByChildKey(childKeyOrIndex)
    this.removeChildListeners(childKeyOrIndex)

    // TODO: его надо удалить из this.allValues тоже
    //       но тогда останется его definition
    //       и что делать если в definition должен быть потомок если required???
    //       создать заного потомка???
    //       а в struct что делать??? там же потомок обязателен
  }

  private listenChildEvents(mySuperChild: ProxifiedSuperValue, childKeyOrIndex: string | number) {
    this.childEventHandlers[childKeyOrIndex] = {
      // bubble child events to me
      [SUPER_VALUE_EVENTS.change]: mySuperChild.subscribe((target: ProxifiedSuperValue, path?: string) => {
        if (!path) {
          console.warn(`WARNING: Bubbling child event without path. Root is "${this.pathToMe}"`)

          return
        }

        return this.events.emit(SUPER_VALUE_EVENTS.change, target, path)
      }),
      [SUPER_VALUE_EVENTS.destroy]: mySuperChild[SUPER_VALUE_PROP].events.addListener(
        SUPER_VALUE_EVENTS.destroy,
        () => this.handleSuperChildDestroy(childKeyOrIndex)
      ),
    }
  }

}
