import {SuperScope} from './scope.js';
import {deepHasSprog, isSprogLang} from '../lang/helpers.js';


// TODO: add inline conditions
// TODO: add block - ( ... )
// TODO: test deep
// TODO: см какие ещё есть операторы


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


export async function executeLineExpr(items: any[], scope: SuperScope): Promise<any> {
  let evalStr = ''

  for (const item of items) {

    if (typeof item === 'string') {
      // symbol
      if (!EXPR_SIGNS[item]) throw new Error(`Unknown expression sign "${item}"`)

      evalStr += item
    }
    else if (isSprogLang(item) || deepHasSprog(item)) {
      // expression
      // TODO: могут быть не безопасны вызовы ф-й и jsExp
      // TODO: поддержка deep
      let exprRes = await scope.$run(item)

      if (typeof exprRes === 'function') {
        throw new Error(`It isn't allowed to return a function in lineExp item`)
      }
      else if (typeof exprRes === 'string') {
        // TODO: если вернулась строка - то надо санитизировать её
      }
      else if (deepHasSprog(exprRes)) {
        // TODO: выполнить
      }
      // for other type it is ok

      evalStr += exprRes
    }
    else {
      throw new Error(`Unknown type of expression item "${item}"`)
    }
  }

  return eval(evalStr)
}
