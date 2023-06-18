import {EXP_MARKER} from '../constants.js';
import {SUPER_EXP_TYPE, SuperExpType} from '../lib/SuperExp.js';


export function isSprogLang(someValue: any): boolean {
  if (!someValue || typeof someValue !== 'object') return false

  return Boolean(someValue[EXP_MARKER])
}

export function isSprogExpr(someValue: any): boolean {
  if (!someValue || typeof someValue !== 'object' || !someValue[EXP_MARKER]) return false

  return Boolean(SUPER_EXP_TYPE[someValue[EXP_MARKER] as SuperExpType])
}

/**
 * Remove props which are have expressions
 */
export function removeExpressions(values: Record<any, any>): Record<any, any> {
  const res: Record<any, any> = { ...values }

  for (const [key, value] of Object.entries(values)) {
    if (isSprogExpr(value)) delete res[key]
  }

  return res
}

/**
 * Remove props which are have simple values, not expressions
 */
export function removeSimple(values: Record<any, any>): Record<any, any> {
  const res: Record<any, any> = { ...values }

  for (const [key, value] of Object.entries(values)) {
    if (!isSprogExpr(value)) delete res[key]
  }

  return res
}
