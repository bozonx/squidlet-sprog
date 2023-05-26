import { SuperScope } from '../scope.js';
import { SimpleType } from '../types/valueTypes.js';
import { SprogDefinition } from '../types/types.js';
export declare function logicAnd(scope: SuperScope): (p: {
    items: (SprogDefinition | SimpleType)[];
}) => Promise<boolean>;
export declare function logicOr(scope: SuperScope): (p: {
    items: (SprogDefinition | SimpleType)[];
}) => Promise<boolean>;
export declare function logicNot(scope: SuperScope): (p: {
    value: (SprogDefinition | SimpleType);
}) => Promise<boolean>;
export declare function isEqual(scope: SuperScope): (p: {
    it: (SprogDefinition | SimpleType);
    and: (SprogDefinition | SimpleType);
}) => Promise<boolean>;
export declare function isGreater(scope: SuperScope): (p: {
    it: (SprogDefinition | SimpleType);
    than: (SprogDefinition | SimpleType);
}) => Promise<boolean>;
export declare function isLess(scope: SuperScope): (p: {
    it: (SprogDefinition | SimpleType);
    than: (SprogDefinition | SimpleType);
}) => Promise<boolean>;
