import {isEmptyObject, omitObj} from 'squidlet-lib'
import {newScope, SuperScope} from './scope.js'
import {SprogDefinition} from '../types/types.js';
import {RedefineDefinition, SuperItemDefinition, SuperItemInitDefinition} from '../types/SuperItemDefinition.js';
import {SuperBase} from './SuperBase.js';
import {ProxyfiedStruct, SuperStruct} from './SuperStruct.js';
import {AllTypes} from '../types/valueTypes.js';
import {EXP_MARKER} from '../constants.js';
import {SUPER_VALUE_PROP, validateChildValue} from './superValueHelpers.js';


export const SUPER_RETURN = 'superReturn'


// TODO: можно по каждому prop добавить combined в scope как алиас
// TODO: может добавить событие вызова ф-и или лучше middleware???


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
  readonly paramsDefinitions: Record<keyof T, SuperItemInitDefinition>
  appliedValues: Record<string, any> = {}
  protected proxyFn: (instance: any) => any = proxifySuperFunc
  private readonly scope: SuperScope


  constructor(
    scope: SuperScope,
    paramsDefinitions: Record<keyof T, SuperItemInitDefinition> = {} as any,
    lines: SprogDefinition[] = [],
    redefine?: Record<string, RedefineDefinition>
  ) {
    super()

    this.scope = scope
    this.paramsDefinitions = redefineParams(paramsDefinitions as any, redefine) as any
    this.lines = lines
  }


  /**
   * Apply values of function's params to exec function later.
   * It replaces previously applied values
   */
  applyValues = (values: Record<string, any>) => {
    // TODO: а оно надо вообще?

    // for (const key of Object.keys(values)) {
    //   const def: SuperItemInitDefinition | undefined = this.paramsDefinitions[key as keyof T]
    //
    //   if (!def) continue
    //
    //   validateChildValue(def, key, values[key])
    // }

    this.appliedValues = values
  }

  exec = async (values?: Record<string, any>): Promise<any> => {
    const finalValues = {
      ...this.appliedValues,
      ...values,
    }
    const paramsStruct: ProxyfiedStruct = (new SuperStruct(
      this.paramsDefinitions,
      true
    )).getProxy()
    // it will validate values
    paramsStruct.$super.init(finalValues)
    // inherit scope for execution context
    const scope = this.scope.$inherit({})
    // set readonly params to scope
    scope.$super.define(
      'params',
      { type: 'SuperStruct', readonly: true },
      paramsStruct
    )

    // execute lines
    for (const line of this.lines) {
      if (line[EXP_MARKER] === SUPER_RETURN) {
        return scope.$run(line)
      }

      await scope.$run(line)
    }
  }


  // private validateParams(values?: Record<string, any>) {
  //   if (!values) return
  //
  //   for (const key of Object.keys(values)) {
  //     if (!this.)
  //
  //     validateChildValue(values[key])
  //     //this.params.$super.validateItem(key, values[key], true)
  //   }
  // }

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
