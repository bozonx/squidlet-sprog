import {
  splitDeepPath,
  lastItem,
} from 'squidlet-lib';


export abstract class SuperBase {
  readonly isSuper: boolean = true

  protected proxyfiedInstance?: any
  // parent super struct or array who owns me
  protected myParent?: SuperBase
  // Path to myself in upper tree. The last part is my name
  protected myPath?: string
  protected inited: boolean = false
  protected abstract proxyFn: (instance: any) => any

  get isInitialized(): boolean {
    return this.inited
  }

  get parent(): SuperBase | undefined {
    return this.myParent
  }

  get pathToMe(): string | undefined {
    return this.myPath
  }

  get myKeyInParent(): string | number | undefined {
    if (!this.myPath) return

    const pathSplat = splitDeepPath(this.pathToMe)

    return lastItem(pathSplat)
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
   * Return proxy of my self and make it if it is the first time
   */
  getProxy(): any | any[] {
    if (!this.proxyfiedInstance) {
      this.proxyfiedInstance = this.proxyFn(this)
    }

    return this.proxyfiedInstance
  }

}
