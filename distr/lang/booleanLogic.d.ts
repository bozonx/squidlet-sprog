import { SprogItemDefinition, SuperScope } from '../scope.js';
import { SimpleType } from '../types/valueTypes.js';
export declare function logicAnd(scope: SuperScope): (p: {
    items: (SprogItemDefinition | SimpleType)[];
}) => Promise<boolean>;
export declare function logicOr(scope: SuperScope): (p: {
    items: (SprogItemDefinition | SimpleType)[];
}) => Promise<boolean>;
export declare function logicNot(scope: SuperScope): (p: {
    value: (SprogItemDefinition | SimpleType);
}) => Promise<boolean>;
export declare function isEqual(scope: SuperScope): (p: {
    it: (SprogItemDefinition | SimpleType);
    and: (SprogItemDefinition | SimpleType);
}) => Promise<boolean>;
export declare function isGreater(scope: SuperScope): (p: {
    it: (SprogItemDefinition | SimpleType);
    than: (SprogItemDefinition | SimpleType);
}) => Promise<boolean>;
export declare function isLess(scope: SuperScope): (p: {
    it: (SprogItemDefinition | SimpleType);
    than: (SprogItemDefinition | SimpleType);
}) => Promise<boolean>;
