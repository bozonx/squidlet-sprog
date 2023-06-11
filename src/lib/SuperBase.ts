import {splitDeepPath, lastItem} from 'squidlet-lib';


export interface SuperBasePublic {
  isSuper: boolean
}

export type ProxyfiedSuperBase<T = any> = SuperBasePublic & {$super: SuperBase} & T

export const SUPER_BASE_PROXY_PUBLIC_MEMBERS = [
  'isSuper',
]


export abstract class SuperBase {
  readonly isSuper: boolean = true

  protected proxyfiedInstance?: any
  // parent super struct or array who owns me
  protected myParent?: ProxyfiedSuperBase
  // Path to myself in upper tree. The last part is my name
  protected myPath?: string
  protected inited: boolean = false
  protected abstract proxyFn: (instance: any) => any

  get isInitialized(): boolean {
    return this.inited
  }

  get parent(): ProxyfiedSuperBase | undefined {
    return this.myParent
  }

  get pathToMe(): string | undefined {
    return this.myPath
  }

  get myKeyOfParent(): string | number | undefined {
    if (typeof this.pathToMe === 'undefined') return

    const pathSplat = splitDeepPath(this.pathToMe)

    return lastItem(pathSplat)
  }


  init(): any {
    // means that item is completely initiated
    this.inited = true
  }

  $$setParent(parent: ProxyfiedSuperBase, myPath: string) {
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
