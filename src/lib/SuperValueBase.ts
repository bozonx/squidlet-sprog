import {
  IndexedEventEmitter,
  deepGet,
  deepHas,
  deepSet,
  deepClone,
  splitDeepPath,
  joinDeepPath,
} from 'squidlet-lib';
import {
  All_TYPES,
  AllTypes,
  ProxifiedSuperValue,
  SIMPLE_TYPES,
  SimpleType,
  SUPER_TYPES,
  SUPER_VALUES
} from '../types/valueTypes.js';
import {
  DEFAULT_INIT_SUPER_DEFINITION,
  SuperItemDefinition,
  SuperItemInitDefinition
} from '../types/SuperItemDefinition.js';
import {isCorrespondingType} from './isCorrespondingType.js';
import {resolveInitialSimpleValue} from './resolveInitialSimpleValue.js';
import {SuperBase} from './SuperBase.js';
import {SUPER_VALUE_CLASSES} from '../constants.js';


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

export const SUPER_VALUE_PROP = '$super'

export function isSuperValue(val: any): boolean {
  return typeof val === 'object' && val.isSuperValue
}

export function prepareDefinitionItem(
  definition: SuperItemInitDefinition,
  defaultRo: boolean = false
): SuperItemDefinition {
  return {
    ...DEFAULT_INIT_SUPER_DEFINITION,
    ...definition,
    readonly: (defaultRo)
      // if ro was set to false in definition then leave false. In other cases true
      ? definition.readonly !== false
      // or just use that value which is was set in definition
      : Boolean(definition.readonly),
  }
}

export function checkDefinition(definition: SuperItemInitDefinition) {
  const {
    type,
    required,
    nullable,
    readonly,
    default: defaultValue,
  } = definition

  if (type && !Object.keys(All_TYPES).includes(type)) {
    throw new Error(`Wrong type : ${type}`)
  }
  else if (typeof required !== 'undefined' && typeof required !== 'boolean') {
    throw new Error(`required has to be boolean`)
  }
  else if (typeof nullable !== 'undefined' && typeof nullable !== 'boolean') {
    throw new Error(`nullable has to be boolean`)
  }
  else if (typeof readonly !== 'undefined' && typeof readonly !== 'boolean') {
    throw new Error(`readonly has to be boolean`)
  }
  else if (defaultValue && !isCorrespondingType(defaultValue, type, nullable)) {
    throw new Error(
      `Default value ${defaultValue} doesn't meet type: ${type}`
    )
  }
}

/**
 * Resolves value for simple type and
 * any, simple function, super function, classes and other.
 * It assumes that you validated value before
 */
function resolveNotSuperChild(
  definition: SuperItemDefinition,
  initialValue?: any
): SimpleType | undefined {
  // use initial value or default if no initial value
  const value = (typeof initialValue === 'undefined')
    ? definition.default
    : initialValue

  if (typeof value !== 'undefined') return value
  else if (Object.keys(SIMPLE_TYPES).includes(definition.type)) {
    // if no value then make it from simple type
    // return null if nullable or initial value for each type
    // e.g string='', number=0, boolean=false etc
    return resolveInitialSimpleValue(
      definition.type as keyof typeof SIMPLE_TYPES,
      definition.nullable
    )
  }
  else if (Object.keys(All_TYPES).includes(definition.type)) {
    // if no value or default value then return undefined for
    // any, simple function, super function, classes and other.
    return undefined
  }

  throw new Error(`Unsupported definition type of ${definition.type}`)
}

// TODO: почему только в struct а не в data??
export function validateChildValue(
  definition: SuperItemDefinition,
  childKeyOrIndex: string | number,
  value?: any
) {
  if (!definition) throw new Error(`no definition`)

  else if (definition.type === 'any') {
    return
  }
  else if (Object.keys(SUPER_VALUES).includes(definition.type)) {

    // TODO: validate super value
  }
  else if (definition.type === SUPER_TYPES.SuperFunc) {
    // TODO: validate super func
  }
  else if (Object.keys(SIMPLE_TYPES).includes(definition.type)) {
    if (typeof value === 'undefined' && definition.required) {
      throw new Error(`The value of ${childKeyOrIndex} is required, but hasn't defined`)
    }
    else if (typeof value === 'undefined' && !definition.required) {
      return
    }
    else if (!isCorrespondingType(value, definition.type, definition.nullable)) {
      throw new Error(
        `The value of ${childKeyOrIndex} has type ${typeof value}, `
        + `but not ${definition.type}`
      )
    }
    // // Value is defined in this case don't check required.
    // // Check type
    // else if (!isCorrespondingType(value, definition.type, definition.nullable)) {
    //   throw new Error(
    //     `The value of ${childKeyOrIndex} has type ${typeof value}, `
    //     + `but not ${definition.type}`
    //   )
    // }

  }
  // TODO: check other types
}

export abstract class SuperValueBase<T = any | any[]>
  extends SuperBase
  implements SuperValuePublic
{
  readonly isSuperValue = true
  // current values
  readonly abstract values: T
  events = new IndexedEventEmitter()
  protected links: SuperLinkItem[] = []

  get isDestroyed(): boolean {
    return this.events.isDestroyed
  }

  /**
   * Get own keys or indexes
   */
  abstract ownKeys: (string | number)[]


  init(): any {
    super.init()
    // rise an event any way if any values was set or not
    this.events.emit(SUPER_VALUE_EVENTS.change, this, this.pathToMe)
    this.events.emit(SUPER_VALUE_EVENTS.inited)
    // return setter for read only props
    return this.myRoSetter
  }

  destroy() {
    this.events.emit(SUPER_VALUE_EVENTS.destroy)

    for (const linkId in this.links) {
      // actually empty is also undefined
      if (typeof linkId === 'undefined') continue

      this.unlink(Number(linkId))
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
    // reregister path of all the super children
    for (const childId of this.ownKeys) {
      const item = this.values[childId as keyof T] as SuperBase

      // TODO: если есть full ro у родителя то должен установить ro у детей а те у своих детей
      // TODO: если у нового потомка есть старый родитель, то надо отписаться от него

      if (item.$$setParent) item.$$setParent(this, this.makeChildPath(childId))
    }

    this.events.emit(SUPER_VALUE_EVENTS.changeParent)
  }


  abstract isKeyReadonly(key: string | number): boolean

  /**
   * Get only own value not from bottom layer and not deep
   * @param key
   */
  abstract getOwnValue(key: string | number): AllTypes

  /**
   * Set value to own child, not deeper and not to bottom layer.
   * And rise an event of it child
   * @param key
   * @param value
   * @param ignoreRo
   * @returns {boolean} if true then value was found and set. If false value hasn't been set
   */
  abstract setOwnValue(key: string | number, value: AllTypes, ignoreRo?: boolean): boolean

  abstract toDefaultValue(key: string | number): void

  abstract getDefinition(key: string | number): SuperItemDefinition | undefined

  subscribe = (handler: SuperChangeHandler): number => {
    return this.events.addListener(SUPER_VALUE_EVENTS.change, handler)
  }

  unsubscribe = (handlerIndex: number) => {
    this.events.removeListener(handlerIndex, SUPER_VALUE_EVENTS.change)
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
      return deepSet(this.values as any, pathTo, newValue)
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
    for (const key of this.ownKeys) {
      this.toDefaultValue(key)
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
   * @param initialValue
   * @private
   */
  private resolveSuperChild(
    definition: SuperItemDefinition,
    childKeyOrIndex: string | number,
    initialValue?: ProxifiedSuperValue
  ): ProxifiedSuperValue {
    if (initialValue) {
      if (!isSuperValue(initialValue)) throw new Error(`initialValue is not Super Value`)
      // this means the super value has already initialized
      // so now we are linking it as my child and start listening of its events
      this.setupSuperChild(initialValue, childKeyOrIndex)

      return initialValue
    }
    else {
      const superChildType = definition.type as keyof typeof SUPER_VALUES
      // it doesn't need to set whole RO because it will be set in $$setParent() in setupSuperChild()
      const superChildRo = definition.readonly
      let superChild
      // no initialValue
      if (definition.default) {
        // there is has to be a defintion setup of child
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
  }

  /**
   * listen to children to bubble their events
   * @protected
   */
  private setupSuperChild(
    child: ProxifiedSuperValue,
    childKeyOrIndex: string | number
  ) {
    // TODO: поидее надо на всякий случай сначала отписаться от его событий у себя

    child.$super.$$setParent(this, this.makeChildPath(childKeyOrIndex))
    // bubble child events to me
    child.subscribe((target: ProxifiedSuperValue, path?: string) => {
      if (!path) {
        console.warn(`Bubble child event without path. Root is "${this.pathToMe}"`)

        return
      }

      return this.events.emit(SUPER_VALUE_EVENTS.change, target, path)
    })
    child.$super.events.addListener(SUPER_VALUE_EVENTS.destroy, () => {
      this.handleSuperChildDestroy(childKeyOrIndex)
    })
  }

  private handleSuperChildDestroy(childKeyOrIndex: string | number) {
    // TODO: make unlink
    // TODO: remove listeners of child
    //this.unlink(childKeyOrIndex)
  }

}
