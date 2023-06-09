import { SuperScope } from '../lib/scope.js';
import { ProxyfiedStruct } from '../lib/SuperStruct.js';
import { SuperItemDefinition } from '../types/SuperItemDefinition.js';
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
export declare function newSuperStruct<T = any>(scope: SuperScope): (p: {
    definition: SuperItemDefinition;
    defaultRo?: boolean;
}) => Promise<T & ProxyfiedStruct>;
