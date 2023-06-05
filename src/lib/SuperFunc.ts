import {mergeDeepObjects, collectObjValues} from 'squidlet-lib'
import {newScope, SuperScope} from './scope.js'
import {makeFuncProxy} from './functionProxy.js';
import {SprogDefinition} from '../types/types.js';
import {SuperItemInitDefinition} from '../types/SuperItemDefinition.js';
import {SuperBase} from './SuperBase.js';
import {ProxyfiedStruct, SuperStruct} from './SuperStruct.js';
import {AllTypes} from '../types/valueTypes.js';


export class SuperFunc<T = Record<string, AllTypes>> extends SuperBase {
  readonly lines: SprogDefinition[]

  // TODO: review proxy
  protected proxyFn: (instance: any) => any = makeFuncProxy


  private appliedValues: Record<string, any> = {}


  get props(): ProxyfiedStruct {
    return this.scope['props']
  }


  constructor(
    scope: SuperScope,
    props: Record<keyof T, SuperItemInitDefinition>,
    lines: SprogDefinition[]
  ) {
    const funcScope: SuperScope = newScope(undefined, scope)

    super(funcScope)

    const propsStruct: ProxyfiedStruct = (new SuperStruct(scope, props, true)).getProxy()

    propsStruct.$super.init()

    scope.$super.define(
      'props',
      { type: 'SuperStruct', readonly: true },
      propsStruct
    )

    // TODO: можно по каждому prop добавить combined в scope как алиас

    this.lines = lines
  }


  /**
   * Apply values of function's props to exec function later.
   * It replaces previously applied values
   */
  applyValues(values: Record<string, any>) {
    this.validateProps(values)

    this.appliedValues = values
  }

  /**
   * Apply values of function's props to exec function later.
   * It merges new values with previously applied values
   */
  mergeValues(values: Record<string, any>) {
    this.validateProps(values)

    this.appliedValues = mergeDeepObjects(values, this.appliedValues)
  }

  async exec(values?: Record<string, any>): Promise<any> {
    this.validateProps(values)


    //const propsDefaults = collectObjValues(this.props, 'default')

    // TODO: а нужен ли merge??? или просто объединить?
    // TODO: и вообще не нужно
    // const finalValues = mergeDeepObjects(
    //   values,
    //   this.appliedValues
    //   //mergeDeepObjects(this.appliedValues, propsDefaults)
    // )

    this.props.$super.batchSet(values)

    for (const line of this.lines) {
      //await this.scope.$run(line)
    }

    // TODO: как сделать reuturn ??? Он может быть в if, switch или цикле
    //       наверное им в scope передать ф-ю return
    //       но ещё должно остановиться
  }

  /**
   * Make clone of function include applied props
   * but with the same scope
   */
  clone(newScope?: SuperScope, values?: Record<string, any>) {
    const newSuperFunc = new SuperFunc(
      newScope || this.scope,
      this.props,
      this.lines
    )

    if (values) newSuperFunc.applyValues(values)

    return makeFuncProxy(newSuperFunc)
  }


  private validateProps(values?: Record<string, any>) {
    if (!values) return

    for (const key of Object.keys(values)) {
      this.props.$super.validateItem(key, values[key])
    }
  }

}
