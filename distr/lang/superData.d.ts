import { SuperScope } from '../lib/scope.js';
import { SuperItemDefinition } from '../types/SuperItemDefinition.js';
import { ProxyfiedData } from '../lib/SuperData.js';
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
export declare function newSuperData<T = any>(scope: SuperScope): (p: {
    definition: SuperItemDefinition;
    defaultRo?: boolean;
}) => Promise<T & ProxyfiedData>;
