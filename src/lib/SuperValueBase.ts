import {IndexedEvents} from 'squidlet-lib';
import {SuperScope} from '../scope.js';


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


export class SuperValueBase {
  readonly superValue = true
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


  destroy() {
    this.changeEvent.destroy()
  }


  subscribe(handler: SuperChangeHandler): number {
    return this.changeEvent.addListener(handler)
  }

  unsubscribe(handlerIndex: number) {
    this.changeEvent.removeListener(handlerIndex)
  }

}
