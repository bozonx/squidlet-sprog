import { SuperScope } from '../lib/scope.js';
import { ProxyfiedArray, SuperArrayDefinition } from '../lib/SuperArray.js';
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
export declare function newSuperArray(scope: SuperScope): (p: {
    definition: Partial<SuperArrayDefinition>;
}) => Promise<ProxyfiedArray>;
