import {
  deepEachObj,
  deepDelete,
  DONT_GO_DEEPER,
  deepSet,
  deepClone,
  deepGetObjValue
} from 'squidlet-lib';
import {EXP_MARKER} from '../constants.js';
import {sprogFuncs} from '../sprogFuncs.js';


/**
 * Check that value is {$exp: string}.
 * value of $exp has to be one of Sprog lang functions
 * @param someValue
 */
export function isSprogLang(someValue: any): boolean {
  if (!someValue || Array.isArray(someValue) || typeof someValue !== 'object') return false
  else if (!someValue[EXP_MARKER]) return false

  return Boolean(sprogFuncs[someValue[EXP_MARKER] as keyof typeof sprogFuncs])
}

export function deepHasSprog(someValue: any): boolean {
  return Boolean(deepGetObjValue(someValue, EXP_MARKER))
}

/**
 * Remove props which are have expressions
 */
export function removeExpressions(values: Record<any, any>): Record<any, any> {
  const res: Record<any, any> = deepClone(values);

  deepEachObj(
    values,
    (el, key, path) => {
      if (isSprogLang(el)) deepDelete(res, path)
    }
  )

  return res
}

/**
 * Deeply remove props which are not expressions
 */
export function leaveOnlyExpressions(values: Record<any, any>): Record<any, any> {
  const res: Record<any, any> = {}

  deepEachObj(
    values,
    (el, key, path) => {
      if (!isSprogLang(el)) return
      // found sprog expression
      deepSet(res, path, el)
      // if it is an expression - do not go deeper
      return DONT_GO_DEEPER
    }
  )

  return res
}
