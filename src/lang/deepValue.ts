import {deepGetParent} from 'squidlet-lib';
import {SuperScope} from '../lib/scope.js';
import {isSuperValue} from '../lib/SuperValueBase.js';


/**
 * Get simple or super value deeply from scope
 * params:
 *   $exp: getValue
 *   path: obj.param1
 * It supports arrays path like obj.arr[0].param.
 * Path can be an expression
 */
export function getValue(scope: SuperScope) {
  return async (p: {path: string, defaultValue?: any}): Promise<any | undefined> => {
    const path: string = await scope.$resolve(p.path)
    const defaultValue: any | undefined = await scope.$resolve(p.defaultValue)

    return scope.$super.getValue(path, defaultValue)
  }
}

/**
 * Set to existent or not existent variable.
 * If some path parts doesn't exist then it will create them.
 * It supports arrays path like obj.arr[0].param.
 * params:
 *   $exp: setDeepValue
 *   path: obj.param1
 *   value: 1
 * or you can use expression
 *   $exp: setValue
 *     path: obj.param1
 *     value:
 *       $exp: getValue
 *       path: otherObj.param2
 */
export function setValue(scope: SuperScope) {
  return async (p: {path: string, value: any}) => {
    const path: string = await scope.$resolve(p.path)
    const value: any = await scope.$resolve(p.value)

    scope.$super.setValue(path, value)
  }
}

/**
 * Deeply delete a key
 * params:
 *   $exp: deleteValue
 *   path: pathToItemToDelete
 * Arrays are supported
 */
export function deleteValue(scope: SuperScope) {
  return async (p: {path: string}) => {
    const path: string = await scope.$resolve(p.path)
    const [parent, lastPathPart] = deepGetParent(
      scope,
      path
    )

    if (parent && typeof lastPathPart !== 'undefined') {
      if (isSuperValue(parent)) {
        parent.$super.forget(lastPathPart)
      }
      else {
        delete parent[lastPathPart]
      }
    }
  }
}
