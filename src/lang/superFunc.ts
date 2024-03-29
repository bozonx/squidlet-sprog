import {deepGet} from 'squidlet-lib'
import {SprogFn, SuperScope} from '../lib/scope.js'
import {SuperFunc, SuperFuncDefinition} from '../lib/SuperFunc.js'
import {AllTypes} from '../types/valueTypes.js';


/**
 * Call super function. It always await.
 * args:
 *   * path {string} - path to super function in scope
 *   * values {Object} - values of super function's props which will be called
 */
export const callSuperFunc: SprogFn = (scope: SuperScope) => {
  return async (p: {path: string, values: Record<any, any>}): Promise<void> => {
    const fn = deepGet(scope, p.path)

    if (!fn) throw new Error(`Can't find super function ${p.path}`)
    else if (typeof fn !== 'function') throw new Error(`The ${p.path} isn't a function`)

    const finalParams: Record<string, any> = {}
    // collect function params, execute exp if need
    for (const paramName of Object.keys((p.values))) {
      finalParams[paramName] = scope.$resolve(p.values[paramName])
    }

    return fn(finalParams)
  }
}

/**
 * Define super function. Which is always async.
 * Params:
 *   * props - define income props, their type and default value
 *   * lines - any code execution include set vars in scope and return value
 */
export const newSuperFunc: SprogFn = (scope: SuperScope) => {
  return async (p: SuperFuncDefinition): Promise<any> => {
    const params = await scope.$resolve(p.params)
    const redefine = await scope.$resolve(p.redefine)

    return (new SuperFunc(scope, params, p.returnType, p.lines, redefine)).getProxy()
  }
}

export const superReturn: SprogFn = (scope: SuperScope) => {
  return async (p: {
    value: AllTypes
  }): Promise<any> => {
    return await scope.$resolve(p.value)
  }
}
