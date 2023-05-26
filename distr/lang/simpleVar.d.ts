import { SuperScope } from '../scope.js';
/**
 * Register new var in the top of scope only if it doesn't exist.
 * If you don't have to check it then better to use setJsValue
 * params:
 *   $exp: newVar
 *   name: someName
 *   value: 5
 */
export declare function newVar(scope: SuperScope): (p: {
    name: string;
    value: any;
}) => Promise<void>;
/**
 * Delete var from top level of scope
 * params:
 *   $exp: deleteVar
 *   name: nameOfVarToDelete
 */
export declare function deleteVar(scope: SuperScope): (p: {
    name: string;
}) => Promise<void>;
