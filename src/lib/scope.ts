import {
  omitObj,
  deepEachObjAsync,
  deepSet,
  deepClone,
  DONT_GO_DEEPER
} from 'squidlet-lib';
import {sprogFuncs} from '../sprogFuncs.js';
import {EXP_MARKER} from '../constants.js';
import {SprogDefinition} from '../types/types.js';
import {SuperData} from './SuperData.js';
import {stdLib} from '../stdLib.js';
import {SUPER_VALUE_PROP} from './superValueHelpers.js';
import {isSprogLang} from '../lang/helpers.js';


export type SprogScopedFn = (p: any) => Promise<any | void>
export type SprogFn = (scope: SuperScope) => SprogScopedFn

export interface SuperScope {
  $super: SuperData
  /**
   * Clone only self scope props excluding $super, $run and other functions.
   * Means clone only user defined variables.
   */
  $cloneSelf(): any

  /**
   * Get scoped function to run it later
   */
  $getScopedFn(fnName: keyof typeof sprogFuncs): SprogScopedFn

  /**
   * Run sprog function in this scope
   * It accepts sprog definition
   */
  $run(definition: SprogDefinition): Promise<any | void>

  /**
   * Calculate of given values in this scope.
   * To not be confused please use only expressions which returns values and don't set any value
   * @param values - any value of expression or object with values and expressions or
   *                 array of values and expressions
   * @param onlyExecuted - if true then it will return only executed values, and skip
   *                       all other values
   * @returns - the value or object or array with given values and results of expressions
   */
  $calculate(values?: any | any[], onlyExecuted?: boolean): Promise<any | any[] | undefined>

  /**
   * If is is an expression then run it.
   * If not then return a value
   * @param defOrValue
   */
  $resolve(defOrValue: any): Promise<any>

  /**
   * Make a new scope which is inherited by this scope
   */
  $newScope<T = any>(initialVars: T, previousScope?: SuperScope): T & SuperScope

  /**
   * Make a new scope which is inherited by this scope
   * @param initialVars
   */
  $inherit<T = any>(initialVars?: T): T & SuperScope

  [index: string]: any
}


export const SCOPE_FUNCTIONS = [
  '$cloneSelf',
  '$getScopedFn',
  '$run',
  '$calculate',
  '$resolve',
  '$newScope',
  '$inherit',
]


const scopeFunctions: Record<string, any> & Omit<SuperScope, '$super'> = {
  $cloneSelf(): Record<string, any> {
    return this.$super.clone()
  },
  $getScopedFn(fnName: string): SprogScopedFn {
    const sprogFn = sprogFuncs[fnName as keyof typeof sprogFuncs]
    const thisScope = this as SuperScope

    if (!sprogFn) throw new Error(`Sprog doesn't have function ${fnName}`)

    return sprogFn(thisScope)
  },
  $run(definition: SprogDefinition): Promise<any | void> {
    const sprogFn = sprogFuncs[definition.$exp]
    const params: any = omitObj(definition, '$exp')
    const thisScope = this as SuperScope

    if (!sprogFn) throw new Error(`Sprog doesn't have function ${definition.$exp}`)

    return sprogFn(thisScope)(params)
  },
  async $calculate(
    anyValue?: any | any[],
    onlyExecuted: boolean = false
  ): Promise<any | any[] | undefined> {
    const thisScope = this as SuperScope
    // skip any simple values
    if (!Array.isArray(anyValue) && typeof anyValue !== 'object') {
      return (onlyExecuted) ? undefined : anyValue
    }
    else if (isSprogLang(anyValue)) {
      const res = await thisScope.$run(anyValue as SprogDefinition)

      if (!isSprogLang(res)) return res
      // if it returns sprog then calculate it
      return await thisScope.$calculate(res, onlyExecuted)
    }

    const result = (onlyExecuted)
      ? (Array.isArray(anyValue)) ? [] : {}
      : deepClone(anyValue)
    // each plain object
    await deepEachObjAsync(anyValue, async (obj: Record<any, any>, key: string | number, path: string) => {
      // not expressions
      if (!isSprogLang(obj)) return

      const res = await thisScope.$run(obj as SprogDefinition)

      // TODO: что если $exp выдал другой expr???

      deepSet(result, path, res)
      // do not go deeper into expression definition
      return DONT_GO_DEEPER
    })
    // return only executed values, not all which was in source
    return result
  },
  async $resolve(defOrValue: any): Promise<any> {
    if (defOrValue && typeof defOrValue === 'object' && defOrValue[EXP_MARKER]) {
      return this.$run(defOrValue)
    }
    // simple value
    return defOrValue
  },
  $newScope<T = any>(initialVars: T, previousScope?: SuperScope): T & SuperScope {
    return newScope(initialVars, previousScope)
  },
  $inherit<T = any>(initialVars?: T): T & SuperScope {
    const thisScope = this as SuperScope

    return newScope(initialVars, thisScope)
  },
}

export function proxyScope(data: SuperData): SuperScope {
  const handler: ProxyHandler<Record<any, any>> = {
    get(target: any, prop: string) {
      if (prop === SUPER_VALUE_PROP) {
        // $super = SuperData instance
        return data
      }
      else if (SCOPE_FUNCTIONS.includes(prop)) {
        // scope function
        return scopeFunctions[prop].bind(proxyfied)
      }
      // else var of scope
      return data.allValues[prop]
    },

    has(target: any, prop: string): boolean {
      if (prop === SUPER_VALUE_PROP || SCOPE_FUNCTIONS.includes(prop)) {
        return true
      }

      return data.allKeys.includes(prop)
    },

    set(target: any, prop: string, newValue: any): boolean {
      data.setValue(prop, newValue)

      return true
    },

    deleteProperty(target: any, prop: string): boolean {
      throw new Error(`It is forbidden to delete variables from scope`)
    },

    ownKeys(): ArrayLike<string | symbol> {
      return data.allKeys as string[]
    },
  }

  const proxyfied = new Proxy(data.allValues, handler) as SuperScope

  return proxyfied
}


/**
 * It creates a new scope with specified initial variables.
 * Or define these vars into previousScope and use it scope
 * @param initialVars
 * @param previousScope
 */
export function newScope<T = any>(initialVars: T = {} as T, previousScope?: SuperScope): T & SuperScope {
  const data = new SuperData(
    {
      std: {
        type: 'object',
        default: stdLib,
        readonly: true,
      }
    },
    undefined,
    previousScope?.$super
  )
  const scope: SuperScope = proxyScope(data)

  data.init(initialVars as any)

  return scope as T & SuperScope
}
