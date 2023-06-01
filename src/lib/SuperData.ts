import {SuperValueBase} from './SuperValueBase.js';
import {AllTypes} from '../types/valueTypes.js';


export class SuperData<T = Record<string | number, AllTypes>> extends SuperValueBase<T> {
  readonly isData = true
}
