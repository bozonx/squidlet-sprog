import {callSuperFunc, newSuperFunc, superReturn} from './lang/superFunc.js';
import {getValue, setValue} from './lang/deepValue.js';
import {newValue, newVar} from './lang/simpleVar.js';
import {jsExp} from './lang/jsExp.js';
import {
  isLess,
  logicAnd,
  isEqual,
  isGreater,
  logicNot,
  logicOr,
  isGreaterOrEqual,
  isLessOrEqual
} from './lang/booleanLogic.js';
import {ifElse} from './lang/ifElse.js';
import {forEach} from './lang/forEach.js';
import {newSuperStruct} from './lang/superStruct.js';
import {newSuperArray} from './lang/superArray.js';
import {simpleCall} from './lang/simpleFunc.js';
import {newSuperData} from './lang/superData.js';
import {lineExp} from './lang/lineExp.js';


/*
 * SuperProg visual programming language
 */

export const sprogFuncs = {
  ////// Base
  jsExp,
  simpleCall,
  ifElse,
  forEach,
  ////// Variables
  getValue,
  setValue,
  newVar,
  newValue,
  lineExp,
  //deleteVar,
  ////// Boolean logic
  logicAnd,
  logicOr,
  logicNot,
  isEqual,
  isGreater,
  isLess,
  isGreaterOrEqual,
  isLessOrEqual,
  ////// SUPER
  callSuperFunc,
  newSuperFunc,
  superReturn,
  newSuperData,
  newSuperStruct,
  newSuperArray,
}
