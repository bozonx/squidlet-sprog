import { All_TYPES } from '../types/valueTypes.js';
/**
 * If undefined then it will be true.
 * @param value
 * @param type
 * @param nullable
 */
export declare function isCorrespondingType(value: any, type?: keyof typeof All_TYPES, nullable?: boolean): boolean;
