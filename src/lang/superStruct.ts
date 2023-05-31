import {SuperScope} from '../scope.js';
import {SuperStruct, proxyStruct, ProxyfiedStruct} from '../lib/SuperStruct.js';
import {SuperItemDefinition} from '../types/SuperItemDefinition.js';


/**
 * Create a new proxified super struct
 * Example in yaml:
 *   $exp: newSuperStruct
 *   definition:
 *     param1:
 *       type: number
 *       default: 5
 *     # ... other params
 *   defaultRo: true
 *
 * Call it like this: `scope.$run(parsedYaml)`
 */
export function newSuperStruct<T = any>(scope: SuperScope) {
  return async (p: {
    definition: SuperItemDefinition,
    defaultRo?: boolean
  }): Promise<T & ProxyfiedStruct> => {
    const definition = await scope.$resolve(p.definition)
    const defaultRo = await scope.$resolve(p.defaultRo)
    const inner = new SuperStruct(scope, definition, defaultRo)

    return proxyStruct(inner)
  }
}
