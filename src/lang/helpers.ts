import {deepEachObj, deepDelete} from 'squidlet-lib';
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
    if (isSprogExpr(value)) {
      delete res[key]
    }
    else if (
      Array.isArray(value)
      || (value && typeof value !== 'object' && !value.constructor)
    ) {
      // check does it have sprog deep
      deepEachObj(
        value,
        (el, key, path) => {
          const isExpr = isSprogExpr(el)
          // TODO: не работает
          if (isExpr) deepDelete(res, path)
        }
      )

    }
    // all other values are simple
  }

  // for (const [key, value] of Object.entries(values)) {
  //   // TODO: переделать
  //   if (
  //     Array.isArray(value)
  //     || (value && typeof value !== 'object' && !value.constructor)
  //   ) {
  //     // TODO: он тогда всё дерево уберёт где могут быть и simple
  //     // check does it have sprog inside
  //     if (deepFindObj(value, (el) => isSprogExpr(el))) delete res[key]
  //     else continue
  //   }
  //
  //   if (isSprogExpr(value)) delete res[key]
  // }

  return res
}

// TODO: вообще не нужно походу - хотя лучше сделать на всякий случай
// /**
//  * Remove props which are have simple values, not expressions
//  */
// export function removeSimple(values: Record<any, any>): Record<any, any> {
//   const res: Record<any, any> = { ...values }
//
//   for (const [key, value] of Object.entries(values)) {
//     if (isSprogExpr(value)) {
//       // it is top level sprog exp
//       continue
//     }
//     else if (
//       Array.isArray(value)
//       || (value && typeof value !== 'object' && !value.constructor)
//     ) {
//       // check does it have sprog deep
//       // TODO: а если их несколько ??? и ещё и в глубине несколько
//       const found = deepFindObj(
//         res,
//         (el, key, path) => {
//           const isExpr = isSprogExpr(el)
//
//           if (!isExpr) {
//             deepDelete(res, path)
//
//             return true
//           }
//         }
//       )
//
//       if (found) continue
//     }
//     // else simple value - delete it
//     delete res[key]
//   }
//
//   return res
// }
