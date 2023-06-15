import { sprogFuncs } from '../sprogFuncs.js';
import { SprogDefinition } from '../types/types.js';
import { SuperData } from './SuperData.js';
export type SprogScopedFn = (p: any) => Promise<any | void>;
export type SprogFn = (scope: SuperScope) => SprogScopedFn;
export interface SuperScope {
    $super: SuperData;
    /**
     * Clone only self scope props excluding $super, $run and other functions.
     * Means clone only user defined variables.
     */
    $cloneSelf(): any;
    /**
     * Get scoped function to run it later
     */
    $getScopedFn(fnName: keyof typeof sprogFuncs): SprogScopedFn;
    /**
     * Run sprog function in this scope
     * It accepts sprog definition
     */
    $run(definition: SprogDefinition): Promise<any | void>;
    /**
     * If is is an expression then run it.
     * If not then return a value
     * @param defOrValue
     */
    $resolve(defOrValue: any): Promise<any>;
    /**
     * Make a new scope which is inherited by this scope
     */
    $newScope<T = any>(initialVars: T, previousScope?: SuperScope): T & SuperScope;
    [index: string]: any;
}
export declare const SCOPE_FUNCTIONS: string[];
export declare function proxyScope(data: SuperData): SuperScope;
/**
 * It creates a new scope with specified initial variables.
 * Or define these vars into previousScope and use it scope
 * @param initialVars
 * @param previousScope
 */
export declare function newScope<T = any>(initialVars?: T, previousScope?: SuperScope): T & SuperScope;
