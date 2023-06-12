import { getValue, setValue } from './lang/deepValue.js';
import { newVar } from './lang/simpleVar.js';
import { isLess, logicAnd, isEqual, isGreater, logicNot, logicOr, isGreaterOrEqual, isLessOrEqual } from './lang/booleanLogic.js';
import { ifElse } from './lang/ifElse.js';
import { forEach } from './lang/forEach.js';
import { newSuperStruct } from './lang/superStruct.js';
import { newSuperArray } from './lang/superArray.js';
import { newSuperData } from './lang/superData.js';
export declare const sprogFuncs: {
    jsExp: import("./index.js").SprogFn;
    simpleCall: import("./index.js").SprogFn;
    ifElse: typeof ifElse;
    forEach: typeof forEach;
    getValue: typeof getValue;
    setValue: typeof setValue;
    newVar: typeof newVar;
    logicAnd: typeof logicAnd;
    logicOr: typeof logicOr;
    logicNot: typeof logicNot;
    isEqual: typeof isEqual;
    isGreater: typeof isGreater;
    isLess: typeof isLess;
    isGreaterOrEqual: typeof isGreaterOrEqual;
    isLessOrEqual: typeof isLessOrEqual;
    callSuperFunc: import("./index.js").SprogFn;
    newSuperFunc: import("./index.js").SprogFn;
    superReturn: import("./index.js").SprogFn;
    newSuperData: typeof newSuperData;
    newSuperStruct: typeof newSuperStruct;
    newSuperArray: typeof newSuperArray;
};
