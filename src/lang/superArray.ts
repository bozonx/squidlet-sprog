import {SuperScope} from '../scope.js';
import {proxyArray, ProxyfiedArray, SuperArray} from '../lib/SuperArray.js';
import {SuperItemDefinition} from '../types/SuperItemDefinition.js';


/**
 * Create a new proxified super struct
 * Example in yaml:
 *   $exp: newSuperArray
 *   item:
 *     type: number
 *   default: [0,1,2,3]
 *
 * Call it like this: `scope.$run(parsedYaml)`
 */
export function newSuperArray(scope: SuperScope) {
  return async (p: {item?: SuperItemDefinition, default?: any[]}): Promise<ProxyfiedArray> => {
    const item = await scope.$resolve(p.item)
    const defaultArray = await scope.$resolve(p.default)
    const inner = new SuperArray(scope, item, defaultArray)

    return proxyArray(inner)
  }
}
