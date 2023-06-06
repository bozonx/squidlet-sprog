import {isLastIndex} from 'squidlet-lib';
import {newScope, SuperScope} from '../lib/scope.js';
import {logicAnd} from './booleanLogic.js';
import {SprogDefinition} from '../types/types.js';
import {EXP_MARKER} from '../constants.js';
import {SUPER_RETURN} from '../lib/SuperFunc.js';
import {BREAK_CYCLE, CONTINUE_CYCLE} from './forEach.js';


interface IfElseItem {
  condition: SprogDefinition[]
  lines: SprogDefinition[]
}

// TODO: add switch into isElse - можно даже смешивать

/**
 * If else conditions blocks
 * params:
 *   $exp: ifElse
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
 */
export function ifElse(scope: SuperScope) {
  return async (p: { items: IfElseItem[] }) => {
    for (const itemIndex in p.items) {
      const item = p.items[itemIndex]
      // all the item has to have line. But it can be an empty array
      if (!item.lines) {
        throw new Error(`ifElse statement has to have lines`)
      }
      // the first item is IF()
      else if (Number(itemIndex) === 0 && !item.condition) {
        throw new Error(`If statement has to have a condition`)
      }
      // in the middle are ELSE IF()
      else if (
        Number(itemIndex) !== 0
        && !isLastIndex(p.items, itemIndex)
        && !item.condition
      ) {
        throw new Error(`ElseIf statement has to have condition`)
      }

      // for each item for IF and ELSE IF
      // run condition to decide is this iteraction is true
      if (item.condition) {
        const conditionRes: boolean = await logicAnd(scope)({ items: item.condition })
        // do nothing if condition is false
        // and go to the next condition
        if (!conditionRes) continue
      }

      ////// Condition is true - execute lines

      if (!item.lines.length) return
      // new scope layer for block of code
      const exeScope: SuperScope = newScope(undefined, scope)
      // just execute a block if condition is true
      for (const line of item.lines) {
        if (line[EXP_MARKER] === SUPER_RETURN) {
          return exeScope.$run(line)
        }
        else if ((line[EXP_MARKER] as any) === CONTINUE_CYCLE) {
          return '$$' + CONTINUE_CYCLE
        }
        else if ((line[EXP_MARKER] as any) === BREAK_CYCLE) {
          return '$$' + BREAK_CYCLE
        }

        await exeScope.$run(line)
      }
      // Stop executing
      return
    }
  }
}
