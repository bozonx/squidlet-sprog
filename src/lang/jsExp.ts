import {SprogFn, SuperScope} from '../scope.js';
import {evalInSandBox} from '../lib/sandBox.js';


/**
 * Execute JS expression and return result.
 * Params:
 *   $exp: jsExp
 *   exp: 'console.log(varFromScope)'
 * Param "exp" and be an expression
 */
export const jsExp: SprogFn = (scope: SuperScope) => {
  return async (p: {exp?: string}): Promise<any | void> => {
    if (typeof p.exp === 'undefined') return

    const exp: string = await scope.$resolve(p.exp)

    return evalInSandBox(scope, exp)
  }
}
