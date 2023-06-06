import {SuperScope} from '../lib/scope.js';
import {proxyArray, ProxyfiedArray, SuperArray, SuperArrayDefinition} from '../lib/SuperArray.js';


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
  return async (p: {definition: Partial<SuperArrayDefinition>}): Promise<ProxyfiedArray> => {
    const definition = await scope.$resolve(p.definition)
    const inner = new SuperArray(scope, definition)

    return proxyArray(inner)
  }
}
