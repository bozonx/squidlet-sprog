import {SuperScope} from './scope.js';


export abstract class SuperBase {
  protected proxyfiedInstance?: any
  // parent super struct or array who owns me
  protected myParent?: SuperBase
  // Path to myself in upper tree. The last part is my name
  protected myPath?: string
  protected inited: boolean = false
  private myScope: SuperScope
  protected abstract proxyFn: (instance: any) => any

  get scope(): SuperScope {
    return this.myScope
  }

  get isInitialized(): boolean {
    return this.inited
  }

  get parent(): SuperBase | undefined {
    return this.myParent
  }

  get pathToMe(): string | undefined {
    return this.myPath
  }


  protected constructor(scope: SuperScope) {
    this.myScope = scope
  }

  init(): any {
    // means that item is completely initiated
    this.inited = true
  }

  $$setParent(parent: SuperBase, myPath: string) {
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

  /**
   * Return proxy of my self and make it if it is the first time
   */
  getProxy(): any | any[] {
    if (!this.proxyfiedInstance) {
      this.proxyfiedInstance = this.proxyFn(this)
    }

    return this.proxyfiedInstance
  }

}
