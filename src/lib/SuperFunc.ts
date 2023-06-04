import {mergeDeepObjects, collectObjValues} from 'squidlet-lib'
import {AllTypes} from '../types/valueTypes.js'
import {newScope, SuperScope} from './scope.js'
import {makeFuncProxy} from './functionProxy.js';
import {SprogDefinition, SprogDefinitionBase} from '../types/types.js';


export interface SuperFuncProp {
  // type of value
  type: AllTypes
  // default value
  default?: any
  // check if it is undefined
  required?: boolean
  // TODO: do it need to rename some props?
}

export interface SuperFuncParams {
  props: Record<string, SuperFuncProp>
  lines: SprogDefinition[]
}

export type SuperFuncDefinition = SprogDefinitionBase & SuperFuncParams


export class SuperFunc {
  scope: SuperScope

  private readonly props: Record<string, SuperFuncProp>
  private readonly lines: SprogDefinition[]
  private appliedValues: Record<string, any> = {}


  get propsDefaults(): Record<any, any> {
    return collectObjValues(this.props, 'default')
  }


  constructor(scope: SuperScope, {props, lines}: SuperFuncParams) {
    this.scope = scope
    this.props = props
    this.lines = lines
  }


  replaceScope(newScope: SuperScope) {
    this.scope = newScope
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

    const finalValues = mergeDeepObjects(
      values,
      mergeDeepObjects(this.appliedValues, this.propsDefaults)
    )

    const execScope: SuperScope = newScope(finalValues, this.scope)

    //console.log(111, values, finalValues, this.lines, this.props)

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
      {props: this.props, lines: this.lines}
    )

    if (values) newSuperFunc.applyValues(values)

    return makeFuncProxy(newSuperFunc)
  }


  private validateProps(values?: Record<string, any>) {
    // TODO: validate props

  }

}
