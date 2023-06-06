import {SuperScope, SprogFn} from '../lib/scope.js';


// TODO: test
/**
 * Call js function from scope
 * example yaml template:
 *   $ext: simpleCall
 *   path: myFunc
 *   args:
 *     - 1
 *     - 'some value'
 */
export const simpleCall: SprogFn = (scope: SuperScope) => {
  return async (p: {path: string, args?: any[]}): Promise<any | void> => {
    const path: string = await scope.$resolve(p.path)
    const resolvedArgs = []

    if (p.args) {
      for (const arg of p.args) resolvedArgs.push(await scope.$resolve(arg))
    }

    const func = await scope.$run({ $exp: 'getValue', path })

    if (typeof func !== 'function') {
      throw new Error(`It isn't a function`)
    }

    return func(...resolvedArgs)
  }
}


// /**
//  * Define simple func in the top of scope
//  * params:
//  *   $exp: simpleFunc
//  *   name: nameOfFunction
//  *   argsNames: ['arg1', ...]
//  *   lines: [{$exp: getValue, path: somePath}]
//  */
// export function setSimpleFunc(scope: SuperScope) {
//   return async (p: {name: string, argsNames?: string[]}) => {
//     const name: string = await scope.$resolve(p.name)
//     const argsNames: string[] | undefined = await scope.$resolve(p.argsNames)
//
//     // TODO: add lines
//
//     scope[name] = await makeSimpleFunc(scope)({argsNames})
//   }
// }
//
// /**
//  * Create simple func and return it
//  * params:
//  *   $exp: simpleFunc
//  *   argsNames: ['arg1', ...]
//  *   lines: [{$exp: getValue, path: somePath}]
//  */
// export function makeSimpleFunc(scope: SuperScope) {
//   return async (p: {argsNames?: string[]}) => {
//     const argsNames: any | undefined = await scope.$resolve(p.argsNames)
//
//     // TODO: добавить значения по умолчанию
//     // TODO: добавить ? необязательный аргумент
//     // TODO: add lines
//
//     const func = evalInSandBox(scope, `function() {}`)
//   }
// }
