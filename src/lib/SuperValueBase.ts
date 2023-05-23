import {IndexedEvents, trimCharStart, deepGet} from 'squidlet-lib';
import {SuperScope} from '../scope.js';
import {AllTypes} from '../types/valueTypes.js';


export type SuperChangeHandler = (
  // link to element which is changed. It can be a parent or its child
  target: SuperValueBase,
  // path to child element which is changed. If '' then it is parent
  // if it is undefined then means any element of root was changed
  path?: string
) => void


export function isSuperValue(val: any): boolean {
  return typeof val === 'object' && val.superValue
}


export abstract class SuperValueBase {
  readonly superValue = true
  readonly abstract values: any | any[]
  protected parent?: SuperValueBase
  // Path to myself in upper tree. The last part is my name
  protected myPath?: string
  protected changeEvent = new IndexedEvents<SuperChangeHandler>()
  protected inited: boolean = false
  protected scope: SuperScope


  get isInitialized(): boolean {
    return this.inited
  }


  constructor(scope: SuperScope) {
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


  subscribe(handler: SuperChangeHandler): number {
    return this.changeEvent.addListener(handler)
  }

  unsubscribe(handlerIndex: number) {
    this.changeEvent.removeListener(handlerIndex)
  }

  has = (pathTo: string): boolean => {
    return Boolean(this.getValue(pathTo))
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

  // TODO: change event of child
  protected riseMyChangeEvent(key?: keyof T) {
    // let fullPath: string | undefined = key as string
    //
    // if (this.myPath && key) {
    //   fullPath = this.myPath + '.' + String(key)
    // }
    // else if (this.myPath) {
    //   fullPath = this.myPath
    // }

    this.changeEvent.emit(this, fullPath)
  }


}
