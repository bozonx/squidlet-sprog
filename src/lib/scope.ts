import {omitObj, deepEachObjAsync, deepSet, DONT_GO_DEEPER} from 'squidlet-lib';
import {sprogFuncs} from '../sprogFuncs.js';
import {EXP_MARKER} from '../constants.js';
import {SprogDefinition} from '../types/types.js';
import {SuperData} from './SuperData.js';
import {stdLib} from '../stdLib.js';
import {SUPER_VALUE_PROP} from './superValueHelpers.js';
import {isSprogExpr} from '../lang/helpers.js';


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
   * Execute all the expressions in the given plain object or array
   * and return object or array ONLY with values of executed expressions.
   * It you need to have a full array or object you can make deepMerge()
   * @param values
   */
  $runAll(values?: any | any[]): Promise<any | any[] | undefined>

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
  $inherit<T = any>(initialVars: T): T & SuperScope

  [index: string]: any
}


export const SCOPE_FUNCTIONS = [
  '$cloneSelf',
  '$getScopedFn',
  '$run',
  '$runAll',
  '$resolve',
  '$newScope',
  '$inherit',
]


const scopeFunctions: Record<string, any> & Omit<SuperScope, '$super'> = {

  // TODO: не работает если есть вложенный scope
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
  async $runAll(arrOrObjWithExpressions?: any | any[]): Promise<any | any[] | undefined> {
    if (!arrOrObjWithExpressions) return

    const thisScope = this as SuperScope
    const result = (Array.isArray(arrOrObjWithExpressions)) ? [] : {}
    // each plain object
    await deepEachObjAsync(arrOrObjWithExpressions, async (obj: Record<any, any>, key: string | number, path: string) => {
      // skip not expressions
      if (!isSprogExpr(obj)) return

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
  $inherit<T = any>(initialVars: T): T & SuperScope {
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
      return data.values[prop]
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
      //data.forget(prop)
      //return true
    },

    ownKeys(): ArrayLike<string | symbol> {
      return data.allKeys as string[]
    },
  }

  const proxyfied = new Proxy(data.values, handler) as SuperScope

  return proxyfied
}


/**
 * It creates a new scope with specified initial variables.
 * Or define these vars into previousScope and use it scope
 * @param initialVars
 * @param previousScope
 */
export function newScope<T = any>(initialVars: T = {} as T, previousScope?: SuperScope): T & SuperScope {

  // TODO: test что нельзя удалять переменные из scope

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





// export function proxyScope(data: SuperData, previousScope?: SuperScope): SuperScope {
//   const handler: ProxyHandler<Record<any, any>> = {
//     get(target: any, prop: string) {
//
//       // TODO: Object.keys(data.values) поменять на data.ownKeys
//
//
//       if (prop === SUPER_VALUE_PROP) {
//         // $super = SuperData instance
//         return data
//       }
//       else if (SCOPE_FUNCTIONS.includes(prop)) {
//         // scope function
//         return scopeFunctions[prop].bind(proxyfied)
//       }
//       else if (Object.keys(data.values).includes(prop)) {
//         // var of current scope
//         return data.values[prop]
//       }
//       else if (previousScope) {
//         console.log(2222, prop)
//
//         // var of lower scope
//         return previousScope[prop]
//       }
//
//       return data.values[prop]
//     },
//
//     has(target: any, prop: string): boolean {
//       if (prop === SUPER_VALUE_PROP || SCOPE_FUNCTIONS.includes(prop)) {
//         return true
//       }
//
//       //return Object.keys(data.values).includes(prop)
//
//       if (Object.keys(data.values).includes(prop)) return true
//       else if (previousScope && previousScope.$super.values.includes(prop)) return true
//
//       return false
//     },
//
//     set(target: any, prop: string, newValue: any): boolean {
//       //data.setOwnValue(prop, newValue)
//
//       if (Object.keys(data.values).includes(prop)) {
//         data.setOwnValue(prop, newValue)
//       }
//       else if (previousScope) {
//         previousScope.$super.setOwnValue(prop, newValue)
//       }
//
//       return true
//     },
//
//     deleteProperty(target: any, prop: string): boolean {
//       data.forget(prop)
//
//       if (previousScope) previousScope.$super.forget(prop)
//
//       return true
//     },
//
//     ownKeys(): ArrayLike<string | symbol> {
//       return [
//         ...Object.keys(previousScope?.$super.values || []),
//         ...Object.keys(data.values),
//       ]
//     },
//   }
//
//   const proxyfied = new Proxy(data.values, handler) as SuperScope
//
//   return proxyfied
// }
