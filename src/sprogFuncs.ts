import {simpleCall} from './lang/simpleCall.js';
import {callSuperFunc, newSuperFunc} from './lang/superFunc.js';
import {deleteValue, getValue, setValue} from './lang/deepValue.js';
import {deleteVar, newVar} from './lang/simpleVar.js';
import {jsExp} from './lang/jsExp.js';
import {isLess, logicAnd, isEqual, isGreater, logicNot, logicOr} from './lang/booleanLogic.js';
import {ifElse} from './lang/ifElse.js';
import {forEach} from './lang/forEach.js';
import {newSuperStruct} from './lang/superStruct.js';
import {newSuperArray} from './lang/superArray.js';


// TODO: доделать SuperStruct & SuperArray
// TODO: add switch into isElse
// TODO: SuperFunc - add return
// TODO: review forEach - add support of return, break, continue, inner cycles and ifElse

// TODO: simple function вообще нужен тогда???
// TODO: add SuperPromise
// TODO: add SuperError - объект. И вообще продумать поднятие ошибок
// TODO: add module
// TODO: add simpleClass
// TODO: add SuperClass
// TODO: add test

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
  deleteValue,
  newVar,
  deleteVar,
  ////// Boolean logic
  logicAnd,
  logicOr,
  logicNot,
  isEqual,
  isGreater,
  isLess,
  ////// SUPER
  callSuperFunc,
  newSuperFunc,
  newSuperStruct,
  newSuperArray,
}
