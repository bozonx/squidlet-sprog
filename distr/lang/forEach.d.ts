import { SprogDefinition, SuperScope } from '../scope.js';
interface ForEachParams {
    reverse?: boolean;
    src: any[] | Record<string, any>;
    do: SprogDefinition[];
}
/**
 * Super for each cycle
 * It allows to iteract arrays and objects
 * params:
 *   $exp: forEach
 *   # default is false. If true then the cycle will start from the end
 *   reverse: false
 *   # src is a source array to iteract
 *   src:
 *     $exp: getValue
 *     path: somePath
 *   # do is an array of expressions which are called in local scope
 *   do:
 *     - $exp: setValue
 *       path: somePath
 *       value: 5
 */
export declare function forEach(scope: SuperScope): (p: ForEachParams) => Promise<void>;
export {};
