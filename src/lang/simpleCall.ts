import {SprogFn, SuperScope} from '../scope.js';


/**
 * Call js function
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
    const args: string = await scope.$resolve(p.args)
    const func = await scope.$getScopedFn('getValue')({ path })

    if (typeof func !== 'function') {
      throw new Error(`It isn't a function`)
    }

    return func(args)
  }
}
