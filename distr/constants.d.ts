import { SUPER_VALUES, SuperValues } from './types/valueTypes.js';
import { SuperItemInitDefinition } from './types/SuperItemDefinition.js';
export declare const EXP_MARKER = "$exp";
export type SuperClasses = new (definition?: Record<string, SuperItemInitDefinition>, defaultRo?: boolean) => SuperValues;
export declare const SUPER_VALUE_CLASSES: Record<keyof typeof SUPER_VALUES, SuperClasses>;
