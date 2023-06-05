import {SuperScope} from '../lib/scope.js';
import {SimpleType} from '../types/valueTypes.js';
import {SprogDefinition} from '../types/types.js';


export function logicAnd(scope: SuperScope) {
  return async (p: { items: (SprogDefinition | SimpleType)[] }): Promise<boolean> => {
    for (const rawItem of p.items) {
      const item = await scope.$resolve(rawItem)

      if (!item) return false
    }

    return true
  }
}

export function logicOr(scope: SuperScope) {
  return async (p: { items: (SprogDefinition | SimpleType)[] }): Promise<boolean> => {
    for (const rawItem of p.items) {
      const item = await scope.$resolve(rawItem)

      if (item) return true
    }

    return false
  }
}

export function logicNot(scope: SuperScope) {
  return async (p: { value: (SprogDefinition | SimpleType) }): Promise<boolean> => {
    const value = await scope.$resolve(p.value)

    return !value
  }
}

export function isEqual(scope: SuperScope) {
  return async (p: { items: (SprogDefinition | SimpleType)[] }): Promise<boolean> => {
    let prevItem = await scope.$resolve(p.items[0])

    for (const item of p.items.slice(1)) {
      const itemRes = await scope.$resolve(item)

      if (itemRes !== prevItem) return false
    }

    return true
  }
}

export function isGreater(scope: SuperScope) {
  return async (p: { items: (SprogDefinition | SimpleType)[] }): Promise<boolean> => {
    const it = await scope.$resolve(p.items[0])
    const than = await scope.$resolve(p.items[1])

    return it > than
  }
}

export function isLess(scope: SuperScope) {
  return async (p: { items: (SprogDefinition | SimpleType)[] }): Promise<boolean> => {
    const it = await scope.$resolve(p.items[0])
    const than = await scope.$resolve(p.items[1])

    return it < than
  }
}

// TODO: greater or equeal
// TODO: less or equeal
