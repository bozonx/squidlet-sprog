import {lastItem} from 'squidlet-lib';
import {newScope, SuperScope} from '../lib/scope.js';
import {SprogDefinition} from '../types/types.js';


// TODO: test break, continue inside forEach and ifElse
// TODO: add break
// TODO: add continue
// TODO: add support of inner cycle
// TODO: add support of inner if else
// TODO: add skips


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
    const reverse: Record<any, any> | any[] = await scope.$resolve(p.reverse)

    if (Array.isArray(src)) {
      if (!src.length) return

      const firstIndex = (reverse) ? src.length - 1 : 0
      const lastIndex = (reverse) ? 0 : src.length - 1
      // array iteration
      for (
        let i = firstIndex;
        (reverse) ? i >= src.length : i < src.length;
        (reverse) ? i-- : i++
      ) {
        await doIteraction(p.do, scope, i, i, src[i], firstIndex, lastIndex)
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
        (reverse) ? i >= keys.length : i < keys.length;
        (reverse) ? i-- : i++
      ) {
        const keyStr = keys[i]

        await doIteraction(p.do, scope, i, keyStr, src[keyStr], firstIndex, lastIndex)
      }
    }
    else {
      throw new Error(`Unsupported types of src: ${typeof src}`)
    }
  }
}


async function doIteraction(
  lines: SprogDefinition[],
  scope: SuperScope,
  i: number,
  key: number | string,
  value: any,
  firstIndex: number,
  lastIndex: number,
) {
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
    // TODO: catch return
    // TODO: catch continue
    // TODO: catch break
    await localScope.$run(line)
  }
}
