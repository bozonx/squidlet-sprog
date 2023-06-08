import { SuperScope } from '../lib/scope.js';
import { SuperItemDefinition } from '../types/SuperItemDefinition.js';
/**
 * Register new var in the top of scope only if it doesn't exist.
 * If you don't have to check it then better to use setJsValue
 * params:
 *   $exp: newVar
 *   name: someName
 *   # use it without definition,
 *   # if definition is set then this value will be default value of definition
 *   value: 5
 *   definition: { ... definition of super item, see in SuperData }
 */
export declare function newVar(scope: SuperScope): (p: {
    name: string;
    value: any;
    definition: SuperItemDefinition;
}) => Promise<void>;
