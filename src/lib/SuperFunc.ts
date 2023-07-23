import {isEmptyObject, omitObj} from 'squidlet-lib'
import {newScope, SuperScope} from './scope.js'
import {SprogDefinition} from '../types/types.js';
import {RedefineDefinition, SuperItemDefinition, SuperItemInitDefinition} from '../types/SuperItemDefinition.js';
import {SuperBase} from './SuperBase.js';
import {ProxyfiedStruct, SuperStruct} from './SuperStruct.js';
import {AllTypes} from '../types/valueTypes.js';
import {EXP_MARKER} from '../constants.js';
import {SUPER_VALUE_PROP} from './superValueHelpers.js';


export const SUPER_RETURN = 'superReturn'


// TODO: можно по каждому prop добавить combined в scope как алиас
// TODO: если в prop есть супер значение то им должно быть проставлено readonly
// TODO: может добавить событие вызова ф-и или лучше middleware???
// TODO: если в prop не указан default значит он required


export interface SuperFuncDefinition {
  // params of function object like
  params: Record<string, SuperItemDefinition>
  // lines of sprog expressions
  lines: SprogDefinition[]
  // change some params properties or rename them
  redefine?: Record<string, RedefineDefinition>
}

export function redefineParams(
  paramsDefinitions: Record<string, SuperItemDefinition>,
  redefine?: Record<string, RedefineDefinition>
): Record<string, SuperItemDefinition> {
  if (!redefine || isEmptyObject(redefine)) return paramsDefinitions

  const result: Record<string, SuperItemDefinition> = {}

  for (const key of Object.keys(paramsDefinitions)) {
    if (!redefine[key]) {
      result[key] = paramsDefinitions[key]

      continue
    }

    const keyName = redefine[key].rename || key

    result[keyName] = {
      ...paramsDefinitions[key],
      ...omitObj(redefine[key], 'rename')
    }
  }

  return result
}


export function proxifySuperFunc(obj: any): (() => any) {
  const funcProxyHandler: ProxyHandler<any> = {
    apply(target: any, thisArg: any, argArray: any[]) {
      return obj.exec(...argArray)
    },

    get(target: any, prop: string): any {
      // $super
      if (prop === SUPER_VALUE_PROP) return obj

      return obj[prop]
    },

    has(target: any, prop: string): boolean {
      if (prop === SUPER_VALUE_PROP) return true

      return Boolean(obj[prop])
    }
  }

  function fakeFunction () {}

  return new Proxy(fakeFunction, funcProxyHandler)
}


export class SuperFunc<T = Record<string, AllTypes>> extends SuperBase {
  readonly isSuperFunc: boolean = true
  readonly lines: SprogDefinition[]
  appliedValues: Record<string, any> = {}
  protected proxyFn: (instance: any) => any = proxifySuperFunc
  private readonly paramsSetter
  private readonly scope: SuperScope

  get params(): ProxyfiedStruct {
    return this.scope['params']
  }


  constructor(
    scope: SuperScope,
    paramsDefinitions: Record<keyof T, SuperItemInitDefinition>,
    lines: SprogDefinition[],
    redefine?: Record<string, RedefineDefinition>
  ) {
    super()

    this.scope = newScope(undefined, scope)

    const redefinedParams = redefineParams(
      paramsDefinitions as any,
      redefine
    )
    const paramsStruct: ProxyfiedStruct = (new SuperStruct(redefinedParams, true))
      .getProxy()

    this.paramsSetter = paramsStruct.$super.init()

    // set params to scope
    this.scope.$super.define(
      'params',
      { type: 'SuperStruct', readonly: true },
      paramsStruct
    )

    this.lines = lines
  }


  /**
   * Apply values of function's params to exec function later.
   * It replaces previously applied values
   */
  applyValues = (values: Record<string, any>) => {
    this.validateParams(values)

    this.appliedValues = values
  }

  exec = async (values?: Record<string, any>): Promise<any> => {
    this.validateParams(values)

    const finalValues = {
      ...this.appliedValues,
      ...values,
    }

    // TODO: не правильно, лучше создавать новый scope
    for (const key of Object.keys(finalValues)) {
      this.paramsSetter(key, finalValues[key])
    }

    for (const line of this.lines) {
      if (line[EXP_MARKER] === SUPER_RETURN) {
        return this.scope.$run(line)
      }

      await this.scope.$run(line)
    }
  }


  private validateParams(values?: Record<string, any>) {
    if (!values) return

    for (const key of Object.keys(values)) {
      this.params.$super.validateItem(key, values[key], true)
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
//   return proxifySuperFunc(newSuperFunc)
// }
