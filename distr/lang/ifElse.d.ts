import { SprogItemDefinition, SuperScope } from '../scope.js';
interface IfElseItem {
    condition: SprogItemDefinition[];
    block: SprogItemDefinition[];
}
/**
 * If else conditions
 * params:
 *   $exp: ifElse
 *   # The first is IF, the last is ELSE or ELSE IF and in the middle always ELSE IF
 *   items:
 *     # at top level condition is logic and
 *     - condition:
 *         - $exp: logicEqual
 *           values:
 *             - 5
 *             - $exp: getValue
 *               path: somePath
 *       block:
 *         - $exp: setValue
 *           path: someVar
 *           value: 5
 */
export declare function ifElse(scope: SuperScope): (p: {
    items: IfElseItem[];
}) => Promise<void>;
export {};