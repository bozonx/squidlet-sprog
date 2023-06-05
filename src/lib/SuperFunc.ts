import {mergeDeepObjects, collectObjValues} from 'squidlet-lib'
import {newScope, SuperScope} from './scope.js'
import {makeFuncProxy} from './functionProxy.js';
import {SprogDefinition} from '../types/types.js';
import {SuperItemDefinition, SuperItemInitDefinition} from '../types/SuperItemDefinition.js';
import {SuperBase} from './SuperBase.js';
import {ProxyfiedStruct, SuperStruct} from './SuperStruct.js';
import {AllTypes} from '../types/valueTypes.js';


// export interface SuperFuncProp {
//   // type of value
//   type: AllTypes
//   // default value
//   default?: any
//   // check if it is undefined
//   required?: boolean
//   // TODO: do it need to rename some props?
// }


// export interface SuperFuncParams {
//   props: Record<string, SuperItemDefinition>
//   lines: SprogDefinition[]
// }
//
// export type SuperFuncDefinition = SprogDefinitionBase & SuperFuncParams


export class SuperFunc<T = Record<string, AllTypes>> extends SuperBase {
  //readonly props: Record<string, SuperItemDefinition>
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
    const execScope: SuperScope = newScope(finalValues, this.scope)

    super(scope)

    const propsStruct: ProxyfiedStruct = (new SuperStruct(scope, props, true)).getProxy()

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
    this.props.$super.validate(values)

    this.appliedValues = values
  }

  /**
   * Apply values of function's props to exec function later.
   * It merges new values with previously applied values
   */
  mergeValues(values: Record<string, any>) {
    this.props.$super.validate(values)

    this.appliedValues = mergeDeepObjects(values, this.appliedValues)
  }

  async exec(values?: Record<string, any>): Promise<any> {
    this.props.$super.validate(values)


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
      await execScope.$run(line)
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


  // private validateProps(values?: Record<string, any>) {
  //   // TODO: validate props
  //
  // }

}
