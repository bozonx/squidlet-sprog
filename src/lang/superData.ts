import {SuperScope} from '../lib/scope.js';
import {SuperItemDefinition} from '../types/SuperItemDefinition.js';
import {proxyData, ProxyfiedData, SuperData} from '../lib/SuperData.js';


/**
 * Create a new proxified super data
 * Example in yaml:
 *   $exp: newSuperData
 *   definition:
 *     param1:
 *       type: number
 *       default: 5
 *     # ... other params
 *   defaultRo: true
 *
 * Call it like this: `scope.$run(parsedYaml)`
 */
export function newSuperData<T = any>(scope: SuperScope) {
  return async (p: {
    definition: SuperItemDefinition,
    defaultRo?: boolean
  }): Promise<T & ProxyfiedData> => {
    const definition = await scope.$resolve(p.definition)
    const defaultRo = await scope.$resolve(p.defaultRo)
    const inner = new SuperData(scope, definition, defaultRo)

    return proxyData(inner)
  }
}
