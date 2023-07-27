import {SuperScope} from './scope.js';
import {deepHasSprog, isSprogLang} from '../lang/helpers.js';
import {SprogDefinition} from '../types/types.js';


// TODO: add inline conditions
// TODO: add block - ( ... )
// TODO: см какие ещё есть операторы
// TODO: как узнать что 2 переменные это один и тот же массив и объект?


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
      else if (deepHasSprog(exprRes)) {
        // if expr was returned then execute it
        exprRes = await scope.$calculate(exprRes)
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

  console.log(1111, evalStr)

  return eval(evalStr)
}
