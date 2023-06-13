import { SuperItemDefinition, SuperItemInitDefinition } from '../types/SuperItemDefinition.js';
import { AllTypes, SimpleType } from '../types/valueTypes.js';
import { SuperArrayDefinition } from './SuperArray.js';
export declare const SUPER_VALUE_PROP = "$super";
export declare function isSuperValue(val: any): boolean;
export declare function isSuperKind(val: any): boolean;
export declare function prepareDefinitionItem(definition: SuperItemInitDefinition, defaultRo?: boolean): SuperItemDefinition;
export declare function checkDefinition(definition?: SuperItemInitDefinition): void;
export declare function checkArrayDefinition(definition?: Partial<SuperArrayDefinition>): void;
export declare function validateChildValue(definition: SuperItemDefinition | undefined, childKeyOrIndex: string | number, value?: any): void;
export declare function checkValueBeforeSet(isInitialized: boolean, definition: SuperItemDefinition | undefined, key: string | number, value?: AllTypes, ignoreRo?: boolean): void;
/**
 * Resolves value for simple type and
 * any, simple function, super function, classes and other.
 * It assumes that you validated value before
 */
export declare function resolveNotSuperChild(definition: SuperItemDefinition, initialValue?: any): SimpleType | undefined;
export declare function makeNewSuperValueByDefinition(definition: SuperItemDefinition, childKeyOrIndex: string | number): void;
