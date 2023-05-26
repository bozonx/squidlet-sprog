import { isLastIndex } from 'squidlet-lib';
import { logicAnd } from './booleanLogic.js';
// TODO: add switch into isElse - можно даже смешивать
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
export function ifElse(scope) {
    return async (p) => {
        for (const itemIndex in p.items) {
            const item = p.items[itemIndex];
            if (!item.block) {
                throw new Error(`If else has to have a block`);
            }
            else if (Number(itemIndex) === 0 && !item.condition) {
                throw new Error(`If statement has to have condition`);
            }
            else if (Number(itemIndex) !== 0
                && !isLastIndex(p.items, itemIndex)
                && !item.condition) {
                throw new Error(`Else if statement has to have condition`);
            }
            // for each item. But "else" doesn't have to have condition
            if (item.condition) {
                const conditionRes = await logicAnd(scope)({ items: item.condition });
                // do nothing if condition is false
                // and go to the next condition
                if (!conditionRes)
                    continue;
            }
            // just execute a block if condition is true
            for (const block of item.block) {
                await scope.$run(block);
            }
            // Stop executing
            return;
        }
    };
}
