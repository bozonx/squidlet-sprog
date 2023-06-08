import { SuperScope } from '../lib/scope.js';
import { SprogDefinition } from '../types/types.js';
import { PrimitiveType } from '../types/valueTypes.js';
interface IfElseItem {
    condition?: SprogDefinition[];
    case?: SprogDefinition[] | PrimitiveType;
    default?: true;
    lines: SprogDefinition[];
}
/**
 * If else conditions blocks
 * params:
 *   $exp: ifElse
 *   switch:
 *     $exp: getValue
 *     path: myValue
 *   # The first is IF, the last is ELSE or ELSE IF and in the middle always ELSE IF
 *   items:
 *     # at top level condition is logic and
 *     - condition:
 *         - $exp: isEqual
 *           items:
 *             - 5
 *             - $exp: getValue
 *               path: somePath
 *       lines:
 *         - $exp: setValue
 *           path: someVar
 *           value: 5
 *     - case:
 *         $exp: getValue
 *         path: comparedValue
 *       lines:
 *         - ...
 *     - default: true
 *       lines:
 *         - ...
 */
export declare function ifElse(scope: SuperScope): (p: {
    switch?: SprogDefinition | PrimitiveType;
    items: IfElseItem[];
}) => Promise<any>;
export {};
