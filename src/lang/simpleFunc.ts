import {SuperScope} from '../scope.js';
import {evalInSandBox} from '../lib/sandBox.js';


/**
 * Define simple func in the top of scope
 * params:
 *   $exp: simpleFunc
 *   name: nameOfFunction
 *   argsNames: ['arg1', ...]
 *   lines: [{$exp: getValue, path: somePath}]
 */
export function setSimpleFunc(scope: SuperScope) {
  return async (p: {name: string, argsNames?: string[]}) => {
    const name: string = await scope.$resolve(p.name)
    const argsNames: string[] | undefined = await scope.$resolve(p.argsNames)

    // TODO: add lines

    scope[name] = await makeSimpleFunc(scope)({argsNames})
  }
}

/**
 * Create simple func and return it
 * params:
 *   $exp: simpleFunc
 *   argsNames: ['arg1', ...]
 *   lines: [{$exp: getValue, path: somePath}]
 */
export function makeSimpleFunc(scope: SuperScope) {
  return async (p: {argsNames?: string[]}) => {
    const argsNames: any | undefined = await scope.$resolve(p.argsNames)

    // TODO: добавить значения по умолчанию
    // TODO: добавить ? необязательный аргумент
    // TODO: add lines

    const func = evalInSandBox(scope, `function() {}`)
  }
}
