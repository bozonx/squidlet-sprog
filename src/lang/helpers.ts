import {deepEachObj, deepDelete, isPlainObject, DONT_GO_DEEPER} from 'squidlet-lib';
import {EXP_MARKER} from '../constants.js';
import {SUPER_EXP_TYPE, SuperExpType} from '../lib/SuperExp.js';


// TODO: test
export function isSprogLang(someValue: any): boolean {
  if (!someValue || typeof someValue !== 'object') return false

  return Boolean(someValue[EXP_MARKER])
}

// TODO: test
export function isSprogExpr(someValue: any): boolean {
  if (!someValue || typeof someValue !== 'object' || !someValue[EXP_MARKER]) return false

  return Boolean(SUPER_EXP_TYPE[someValue[EXP_MARKER] as SuperExpType])
}

/**
 * Remove props which are have expressions
 */
export function removeExpressions(values: Record<any, any>): Record<any, any> {
  const res: Record<any, any> = { ...values }

  deepEachObj(
    values,
    (el, key, path) => {
      if (isSprogExpr(el)) deepDelete(res, path)
    }
  )

  return res
}

/**
 * Deeply remove props which are not expressions
 */
export function leaveOnlyExpressions(values: Record<any, any>): Record<any, any> {
  const res: Record<any, any> = { ...values }

  deepEachObj(
    values,
    (el, key, path) => {
      if (isSprogExpr(el)) {
        // if it is an expression - do not go deeper
        return DONT_GO_DEEPER
      }
      if (Array.isArray(el) || isPlainObject(el)) {
        return
      }

      deepDelete(res, path)
    }
  )

  return res
}
