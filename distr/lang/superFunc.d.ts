import { SprogFn } from '../lib/scope.js';
/**
 * Call super function. It always await.
 * args:
 *   * path {string} - path to super function in scope
 *   * values {Object} - values of super function's props which will be called
 */
export declare const callSuperFunc: SprogFn;
/**
 * Define super function. Which is always async.
 * Params:
 *   * props - define income props, their type and default value
 *   * lines - any code execution include set vars in scope and return value
 */
export declare const newSuperFunc: SprogFn;
export declare const superReturn: SprogFn;
