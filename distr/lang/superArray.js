import { SuperArray } from '../lib/SuperArray.js';
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
export function newSuperArray(scope) {
    return async (p) => {
        const definition = await scope.$resolve(p.definition);
        return (new SuperArray(definition)).getProxy();
    };
}
