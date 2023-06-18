export declare function isSprogLang(someValue: any): boolean;
export declare function isSprogExpr(someValue: any): boolean;
/**
 * Remove props which are have expressions
 */
export declare function removeExpressions(values: Record<any, any>): Record<any, any>;
/**
 * Remove props which are have simple values, not expressions
 */
export declare function removeSimple(values: Record<any, any>): Record<any, any>;
