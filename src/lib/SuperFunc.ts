import {omitObj} from 'squidlet-lib'
import {SuperScope} from './scope.js'
import {SprogDefinition} from '../types/types.js';
import {
  DEFAULT_INIT_SUPER_DEFINITION,
  RedefineDefinition,
  SuperItemDefinition,
  SuperItemInitDefinition
} from '../types/SuperItemDefinition.js';
import {SuperBase} from './SuperBase.js';
import {ProxyfiedStruct, SuperStruct} from './SuperStruct.js';
import {AllTypes} from '../types/valueTypes.js';
import {EXP_MARKER} from '../constants.js';
import {SUPER_VALUE_PROP, validateChildValue} from './superValueHelpers.js';


export const SUPER_RETURN = 'superReturn'


export interface SuperFuncDefinition {
  // params of function object like
  params: Record<string, SuperItemDefinition>
  // lines of sprog expressions
  lines: SprogDefinition[]
  // change some params properties or rename them
  redefine?: Record<string, RedefineDefinition>
}

export function prepareParams(
  paramsDefinitions: Record<string, SuperItemInitDefinition>,
  redefine: Record<string, RedefineDefinition> = {}
): Record<string, SuperItemDefinition> {
  const result: Record<string, SuperItemDefinition> = {}

  for (const key of Object.keys(paramsDefinitions)) {
    const keyName = redefine[key]?.rename || key

    if (redefine[key]) {
      result[keyName] = {
        ...DEFAULT_INIT_SUPER_DEFINITION,
        ...paramsDefinitions[key],
        ...omitObj(redefine[key], 'rename')
      }
    }
    else {
      result[key] = {
        ...DEFAULT_INIT_SUPER_DEFINITION,
        ...paramsDefinitions[key],
      }
    }

    if (typeof result[keyName].default === 'undefined') {
      result[keyName].required = true
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
  readonly paramsDefinitions: Record<keyof T, SuperItemDefinition>
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
    this.paramsDefinitions = prepareParams(paramsDefinitions, redefine) as Record<keyof T, SuperItemDefinition>
    this.lines = lines
  }


  /**
   * Apply values of function's params to exec function later.
   * It replaces previously applied values
   */
  applyValues = (values: Record<string, any>) => {
    for (const key of Object.keys(values)) {
      const def: SuperItemDefinition | undefined = this.paramsDefinitions[key as keyof T]

      if (!def) continue

      validateChildValue(def, key, values[key])
    }

    this.appliedValues = values
  }


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
    const scope = this.scope.$inherit()
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

}
