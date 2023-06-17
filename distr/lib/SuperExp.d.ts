import { SuperScope } from './scope.js';
export declare const SUPER_EXP_TYPE: {
    isEqual: string;
    getValue: string;
    hasValue: string;
    math: string;
};
export type SuperExpType = keyof typeof SUPER_EXP_TYPE;
export interface SuperExpParams {
    type: SuperExpType;
    args?: any[];
}
export declare function execSuperExp(scope: SuperScope, type: SuperExpType, args?: any[]): Promise<any | undefined>;
