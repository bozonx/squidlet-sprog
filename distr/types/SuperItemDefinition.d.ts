import { All_TYPES } from './valueTypes.js';
interface SuperItemDefinitionBase {
    type: keyof typeof All_TYPES;
    default?: any;
}
interface SuperItemDefinitionExtra {
    required: boolean;
    readonly: boolean;
    nullable: boolean;
}
export type SuperItemInitDefinition = SuperItemDefinitionBase & Partial<SuperItemDefinitionExtra>;
export type RedefineDefinition = SuperItemInitDefinition & {
    rename?: string;
};
export type SuperItemDefinition = SuperItemDefinitionBase & SuperItemDefinitionExtra;
export declare const DEFAULT_INIT_SUPER_DEFINITION: SuperItemDefinition;
export {};
