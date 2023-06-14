import {newScope, SuperScope} from '../lib/scope.js';
import {SprogDefinition} from '../types/types.js';
import {EXP_MARKER} from '../constants.js';
import {SUPER_RETURN} from '../lib/SuperFunc.js';


export const CONTINUE_CYCLE = 'continueCycle'
export const BREAK_CYCLE = 'breakCycle'


interface ForEachParams {
  reverse?: boolean
  src: any[] | Record<string, any>
  // rename value variable to other name
  as?: string
  // rename key variable to other name
  keyAs?: string
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
  // !!! remember that skips don't break cycle.
  // They just tell the cycle to jump to specified position after the end of iteration
  // just skip the next step
  $skipNext(): void
  // will skip specified number of steps bot not greater than the last one
  $skip(numberOfSteps: number): void
  // go to the next specified step number. Not previous
  $toStep(stepNumber: number): void
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
    const as: string | undefined = await scope.$resolve(p.as)
    const keyAs: string | undefined = await scope.$resolve(p.keyAs)

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
        let toStepNum: number = -1
        const toStep = (stepNum: number) => toStepNum = stepNum
        const result = await doIteration(
          p.do, scope, i, i, src[i], firstIndex, lastIndex, toStep, as, keyAs
        )

        if (result === '$$' + BREAK_CYCLE) break
        else if (typeof result !== 'undefined') return result

        if (toStepNum >= 0) i = toStepNum
      }
    }
    else if (src && typeof src === 'object') {
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
        let toStepNum: number = -1
        const toStep = (stepNum: number) => toStepNum = stepNum
        const result = await doIteration(
          p.do, scope, i, keyStr, src[keyStr], firstIndex, lastIndex, toStep, as, keyAs
        )

        if (result === '$$' + BREAK_CYCLE) break
        else if (typeof result !== 'undefined') return result

        if (toStepNum >= 0) i = toStepNum
      }
    }
    else {
      throw new Error(`Unsupported types of src: ${typeof src}`)
    }
  }
}


async function doIteration(
  lines: SprogDefinition[],
  scope: SuperScope,
  i: number,
  key: number | string,
  value: any,
  firstIndex: number,
  lastIndex: number,
  toStep: (stepNum: number) => void,
  as?: string,
  keyAs?: string
): Promise<any> {
  const isRecursive = lastIndex === 0 && firstIndex !== 0
  const localScopeInitial = {
    i,
    [keyAs || 'key']: key,
    [as || 'value']: value,
    $isFirst: i === firstIndex,
    $isLast: i === lastIndex,
    $skipNext() {
      if (isRecursive) {
        const toStepNum = i - 1

        toStep(toStepNum)
      }
      else {
        const toStepNum = i + 1
        // don't worry if it is out of range because of check in "for"
        toStep(toStepNum)
      }
    },
    $skip(numberOfSteps: number) {
      if (isRecursive) {
        const toStepNum = i - numberOfSteps

        toStep(toStepNum)
      }
      else {
        const toStepNum = i + numberOfSteps
        // don't worry if it is out of range because of check in "for"
        toStep(toStepNum)
      }
    },
    $toStep(stepNumber: number) {
      if (isRecursive) {
        toStep(stepNumber + 1)
      }
      else {
        // don't worry if it is out of range because of check in "for"
        toStep(stepNumber - 1)
      }
    }
  } as ForEachLocalScope

  const localScope = newScope(localScopeInitial, scope)

  for (const line of lines) {
    if ((line[EXP_MARKER] as any) === CONTINUE_CYCLE) continue
    else if ((line[EXP_MARKER] as any) === BREAK_CYCLE) return '$$' + BREAK_CYCLE
    else if (line[EXP_MARKER] === SUPER_RETURN) {
      return localScope.$run(line)
    }

    const res = await localScope.$run(line)

    if (res === '$$' + CONTINUE_CYCLE) continue
    else if (res === '$$' + BREAK_CYCLE) return '$$' + BREAK_CYCLE
    else if (typeof res !== 'undefined') return res
  }
}
