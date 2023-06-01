import {SuperValueBase} from './SuperValueBase.js';
import {AllTypes} from '../types/valueTypes.js';


// TODO: он может содержать ключи как string так и number
// TODO: он может работать как массив и объект одновременно
// TODO: можно сортировать ключи, reverse, pop, etc
// TODO: добавление нового элемента это push
// TODO: тип, ro и тд ставится сразу на весь объект как в массиве
// TODO: типов может быть несколько
// TODO: required не будет, поэтому возможен undefined


export class SuperData<T = any> extends SuperValueBase<Record<string| number, T>> {
  readonly isData = true
}
