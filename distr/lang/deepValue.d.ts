import { SuperScope } from '../lib/scope.js';
/**
 * Get simple or super value deeply from scope
 * params:
 *   $exp: getValue
 *   path: obj.param1
 * It supports arrays path like obj.arr[0].param.
 * Path can be an expression
 */
export declare function getValue(scope: SuperScope): (p: {
    path: string;
    defaultValue?: any;
}) => Promise<any | undefined>;
/**
 * Set to existent or not existent variable.
 * If some path parts doesn't exist then it will create them.
 * It supports arrays path like obj.arr[0].param.
 * params:
 *   $exp: setDeepValue
 *   path: obj.param1
 *   value: 1
 * or you can use expression
 *   $exp: setValue
 *     path: obj.param1
 *     value:
 *       $exp: getValue
 *       path: otherObj.param2
 */
export declare function setValue(scope: SuperScope): (p: {
    path: string;
    value: any;
}) => Promise<void>;
/**
 * Deeply delete a key
 * params:
 *   $exp: deleteValue
 *   path: pathToItemToDelete
 * Arrays are supported
 */
export declare function deleteValue(scope: SuperScope): (p: {
    path: string;
}) => Promise<void>;
