import {SuperScope} from './scope.js';
import {isSprogLang} from '../lang/helpers.js';
import {SprogDefinition} from '../types/types.js';


export type LineExprItem = string | SprogDefinition

export const EXPR_SIGNS: Record<string, string> = {
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
  '%': '%',
  '&&': '&&',
  '||': '||',
  '===': '===',
  '&': '&',
  '|': '|',
  '<': '<',
  '>': '>',
  '<<': '<<',
  '>>': '>>',
}


/**
 * Execute inline expression.
 * It supports only simple values. Functions, arrays and objects aren't supported.
 * @param items
 * @param scope
 */
export async function executeLineExpr(items: LineExprItem[], scope: SuperScope): Promise<any> {
  const evalItems: string[] = []

  for (const item of items) {
    if (typeof item === 'string') {
      // symbol
      if (!EXPR_SIGNS[item]) throw new Error(`Unknown expression sign "${item}"`)

      evalItems.push(item)
    }
    else if (isSprogLang(item)) {
      // expression
      // TODO: могут быть не безопасны вызовы ф-й и jsExp
      let exprRes = await scope.$run(item)

      if (typeof exprRes === 'function') {
        throw new Error(`It isn't allowed to return a function in lineExp item`)
      }
      else if (Array.isArray(exprRes)) {
        throw new Error(`It isn't allowed to return an array in lineExp item`)
      }
      else if (typeof exprRes === 'object') {
        throw new Error(`It isn't allowed to return an object in lineExp item`)
      }
      else if (isSprogLang(exprRes)) {
        // if expr was returned then execute it
        exprRes = await scope.$run(exprRes)
      }
      else if (typeof exprRes === 'string') {
        // TODO: если вернулась строка - то надо санитизировать её
      }

      // for other type it is ok

      evalItems.push(JSON.stringify(exprRes))
    }
    else {
      throw new Error(`Unknown type of expression's item "${item}"`)
    }
  }

  const evalStr = evalItems.join(' ')

  return eval(evalStr)
}
