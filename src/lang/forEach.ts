import {lastItem} from 'squidlet-lib';
import {newScope, SprogFn, SuperScope} from '../lib/scope.js';
import {SprogDefinition} from '../types/types.js';
import {AllTypes} from '../types/valueTypes.js';
import {EXP_MARKER} from '../constants.js';



// TODO: add skips
// TODO: add rename of value and index

export const CONTINUE_CYCLE = 'continueCycle'
export const BREAK_CYCLE = 'breakCycle'


interface ForEachParams {
  reverse?: boolean
  src: any[] | Record<string, any>
  // default is 'item'
  //as?: string
  do: SprogDefinition[]
}

interface ForEachLocalScope {
  // i number of iteration
  i: number
  // string if it is an object and number if it is an array
  key: number | string
  // current value of iteration
  value: any
  // is this first index
  $isFirst: boolean
  // is this last index
  $isLast: boolean
  // just skip the next step
  //$skipNext
  // will skip specified number of steps bot not greater than the last one
  //$skip(numberOfSteps)
  // go to the next specified step number. Not previous
  //$toStep(stepNumber)


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
export function forEach(scope: SuperScope) {
  return async (p: ForEachParams) => {
    const src: Record<any, any> | any[] = await scope.$resolve(p.src)
    const reverse: boolean = await scope.$resolve(p.reverse)

    if (Array.isArray(src)) {
      if (!src.length) return

      const firstIndex = (reverse) ? src.length - 1 : 0
      const lastIndex = (reverse) ? 0 : src.length - 1

      // array iteration
      for (
        let i = firstIndex;
        (reverse) ? i >= 0 : i < src.length;
        (reverse) ? i-- : i++
      ) {
        const needBreak = await doIteration(p.do, scope, i, i, src[i], firstIndex, lastIndex)

        if (needBreak) break
      }
    }
    else if (typeof src === 'object') {
      const keys = Object.keys(src)

      if (!keys.length) return

      const firstIndex = (reverse) ? keys.length - 1 : 0
      const lastIndex = (reverse) ? 0 : keys.length - 1
      // object iteration
      for (
        let i = firstIndex;
        (reverse) ? i >= 0 : i < keys.length;
        (reverse) ? i-- : i++
      ) {
        const keyStr = keys[i]

        const needBreak = await doIteration(p.do, scope, i, keyStr, src[keyStr], firstIndex, lastIndex)

        if (needBreak) break
      }
    }
    else {
      throw new Error(`Unsupported types of src: ${typeof src}`)
    }
  }
}

// export const continueCycle: SprogFn = (scope: SuperScope) => {
//   return async (p: {
//     value: AllTypes
//   }): Promise<any> => {
//     return await scope.$resolve(p.value)
//   }
// }



async function doIteration(
  lines: SprogDefinition[],
  scope: SuperScope,
  i: number,
  key: number | string,
  value: any,
  firstIndex: number,
  lastIndex: number,
): Promise<boolean> {
  const localScopeInitial: ForEachLocalScope = {
    i,
    key,
    value,
    $isFirst: i === firstIndex,
    $isLast: i === lastIndex,
    // TODO: add skips
    //$skipNext
    //$skip
    //$toStep
  }

  const localScope = newScope(localScopeInitial, scope)

  for (const line of lines) {
    if ((line[EXP_MARKER] as any) === CONTINUE_CYCLE) continue
    else if ((line[EXP_MARKER] as any) === BREAK_CYCLE) return true

    // TODO: catch return

    const res = await localScope.$run(line)

    if (res === '$$' + CONTINUE_CYCLE) continue
    else if (res === '$$' + BREAK_CYCLE) return true
  }

  return false
}
