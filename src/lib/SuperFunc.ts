import {newScope, SuperScope} from './scope.js'
import {makeFuncProxy} from './functionProxy.js';
import {SprogDefinition} from '../types/types.js';
import {SuperItemInitDefinition} from '../types/SuperItemDefinition.js';
import {SuperBase} from './SuperBase.js';
import {ProxyfiedStruct, SuperStruct} from './SuperStruct.js';
import {AllTypes} from '../types/valueTypes.js';
import {EXP_MARKER} from '../constants.js';


export const SUPER_RETURN = 'superReturn'


// TODO: можно по каждому prop добавить combined в scope как алиас
// TODO: если в prop есть супер значение то им должно быть проставлено readonly
// TODO: может добавить событие вызова ф-и или лучше middleware???


export class SuperFunc<T = Record<string, AllTypes>> extends SuperBase {
  readonly lines: SprogDefinition[]
  appliedValues: Record<string, any> = {}

  protected proxyFn: (instance: any) => any = makeFuncProxy

  private readonly propsSetter
  private readonly scope: SuperScope


  get props(): ProxyfiedStruct {
    return this.scope['props']
  }


  constructor(
    scope: SuperScope,
    props: Record<keyof T, SuperItemInitDefinition>,
    lines: SprogDefinition[]
  ) {
    super()

    this.scope = newScope(undefined, scope)

    const propsStruct: ProxyfiedStruct = (new SuperStruct(props, true)).getProxy()

    this.propsSetter = propsStruct.$super.init()
    // set prop to scope
    scope.$super.define(
      'props',
      { type: 'SuperStruct', readonly: true },
      propsStruct
    )

    this.lines = lines
  }


  /**
   * Apply values of function's props to exec function later.
   * It replaces previously applied values
   */
  applyValues = (values: Record<string, any>) => {
    this.validateProps(values)

    this.appliedValues = values
  }

  exec = async (values?: Record<string, any>): Promise<any> => {
    this.validateProps(values)

    const finalValues = {
      ...this.appliedValues,
      ...values,
    }

    for (const key of Object.keys(finalValues)) {
      this.propsSetter(key, finalValues[key])
    }

    for (const line of this.lines) {
      if (line[EXP_MARKER] === SUPER_RETURN) {
        return this.scope.$run(line)
      }

      await this.scope.$run(line)
    }

    // TODO: отловить return в if, switch, цикл через scope

  }


  private validateProps(values?: Record<string, any>) {
    if (!values) return

    for (const key of Object.keys(values)) {
      this.props.$super.validateItem(key, values[key], true)
    }
  }

}



// /**
//  * Apply values of function's props to exec function later.
//  * It merges new values with previously applied values
//  */
// mergeValues(values: Record<string, any>) {
//   this.validateProps(values)
//
//   // TODO: а если будет передано super value ???
//   //       тогда получается возмется только значение а не сам инстанс
//
//   this.appliedValues = mergeDeepObjects(values, this.appliedValues)
// }

// /**
//  * Make clone of function include applied props
//  * but with the same scope
//  */
// clone(newScope?: SuperScope, values?: Record<string, any>) {
//   const newSuperFunc = new SuperFunc(
//     newScope || this.scope,
//     this.props,
//     this.lines
//   )
//
//   if (values) newSuperFunc.applyValues(values)
//
//   return makeFuncProxy(newSuperFunc)
// }
