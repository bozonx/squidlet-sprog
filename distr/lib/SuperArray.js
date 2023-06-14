import { arrayKeys, omitObj } from 'squidlet-lib';
import { SUPER_VALUE_PROXY_PUBLIC_MEMBERS, SUPER_VALUE_EVENTS, SuperValueBase } from './SuperValueBase.js';
import { DEFAULT_INIT_SUPER_DEFINITION, } from '../types/SuperItemDefinition.js';
import { checkArrayDefinition, isSuperValue, SUPER_VALUE_PROP } from './superValueHelpers.js';
const ARR_PUBLIC_MEMBERS = [
    ...SUPER_VALUE_PROXY_PUBLIC_MEMBERS,
    'isArray',
    'isReadOnly',
    'length',
    'clearItem',
    'deleteItem',
    /////// mutate array
    'push',
    'pop',
    'shift',
    'unshift',
    'fill',
    'splice',
    'reverse',
    'sort',
    // TODO: а остальные не мутабл методы???
];
/**
 * Wrapper for super array which allows to manipulate it as common array.
 * And it puts some methods to it:
 * * arr.$super - instance of SuperArray
 * * arr. ... - see other methods in ARR_PUBLIC_MEMBERS
 * @param arr
 */
export function proxifyArray(arr) {
    const handler = {
        get(target, prop) {
            // $super
            if (prop === SUPER_VALUE_PROP)
                return arr;
            else if (typeof prop === 'string' && ARR_PUBLIC_MEMBERS.includes(prop)) {
                // public SuperArray prop
                return arr[prop];
            }
            // symbol or index or prop of Array() class
            return arr.values[prop];
        },
        has(target, prop) {
            if (prop === SUPER_VALUE_PROP || ARR_PUBLIC_MEMBERS.includes(prop))
                return true;
            return typeof arr.values[prop] !== 'undefined';
        },
        set(target, prop, value) {
            // Intercept array element assignment
            const index = Number(prop);
            if (Number.isInteger(index)) {
                // set value and rise an event
                return arr.setOwnValue(index, value);
            }
            throw new Error(`It isn't allow to change Array() members`);
        },
        deleteProperty(target, prop) {
            throw new Error(`Don't delete via value proxy! User clearItem() or deleteItem() instead`);
        },
    };
    return new Proxy(arr.values, handler);
}
export class SuperArray extends SuperValueBase {
    isArray = true;
    values = [];
    proxyFn = proxifyArray;
    // definition for all the items of array
    definition;
    get isReadOnly() {
        return Boolean(this.definition.readonly);
    }
    get length() {
        return this.values.length;
    }
    get allKeys() {
        return arrayKeys(this.values);
    }
    constructor(definition, defaultRo = false) {
        super();
        checkArrayDefinition(definition);
        this.definition = {
            ...omitObj(DEFAULT_INIT_SUPER_DEFINITION, 'required'),
            ...definition,
            readonly: (typeof definition?.readonly === 'undefined')
                ? defaultRo
                : definition.readonly
        };
    }
    /**
     * Init with initial values.
     * It returns setter for readonly params
     */
    init = (initialArr) => {
        if (this.inited)
            throw new Error(`The array has been already initialized`);
        this.events.emit(SUPER_VALUE_EVENTS.initStart);
        // set initial values
        const initArrLength = initialArr?.length || 0;
        const defaultArrLength = this.definition.defaultArray?.length || 0;
        const maxLength = Math.max(initArrLength, defaultArrLength);
        // Any way set length to remove odd items. Actually init is allowed to run only once
        // so there should aren't any initialized super values in the rest of array
        this.values.length = maxLength;
        for (const itemIndex of (new Array(maxLength)).keys()) {
            // if index is in range of initalArr then get its item
            // otherwise get from defaultArray
            const value = (itemIndex < initArrLength)
                ? initialArr?.[itemIndex]
                : this.definition.defaultArray?.[itemIndex];
            const childDefinition = this.getDefinition(itemIndex);
            this.values[itemIndex] = this.resolveChildValue(childDefinition, itemIndex, value);
        }
        return super.init();
    };
    destroy = () => {
        super.destroy();
        const values = this.values;
        for (const indexStr of values) {
            if (isSuperValue(values[indexStr])) {
                values[indexStr][SUPER_VALUE_PROP].destroy();
            }
        }
    };
    setOwnValue(keyStr, value, ignoreRo = false) {
        return super.setOwnValue(Number(keyStr), value, ignoreRo);
    }
    getProxy() {
        return super.getProxy();
    }
    getDefinition(index) {
        return {
            type: this.definition.type,
            default: (this.definition.defaultArray)
                ? this.definition.defaultArray[index]
                : this.definition.default,
            readonly: this.definition.readonly,
            nullable: this.definition.nullable,
            required: false,
        };
    }
    batchSet(values) {
        if (!values)
            return;
        for (const key of values.keys()) {
            this.setOwnValue(key, values[key]);
        }
    }
    ///// Array specific methods
    /**
     * Listen only to add, remove or reorder array changes
     */
    onArrayChange(handler) {
        return this.events.addListener(SUPER_VALUE_EVENTS.change, (el, path) => {
            if (el === this && path === this.myPath)
                handler();
        });
    }
    /**
     * Clear item in array by index but not remove index
     * clearItem(1) [0,1,2] will be [0, empty, 2]
     * getting of arr[1] will return undefined
     * @param index
     */
    clearIndex = (index) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        else if (this.isReadOnly) {
            throw new Error(`Can't delete item from readonly array`);
        }
        delete this.values[index];
        this.emitChildChangeEvent(index);
    };
    /**
     * Clear item in array by value but not remove index
     * clearItem(1) [0,1,2] will be [0, empty, 2]
     * getting of arr[1] will return undefined
     * @param value
     */
    clearValue = (value) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        else if (this.isReadOnly) {
            throw new Error(`Can't delete item from readonly array`);
        }
        const index = this.values.indexOf(value);
        if (index < 0)
            return;
        delete this.values[index];
        this.emitChildChangeEvent(index);
    };
    /**
     * Delete item and splice an array
     * deleteItem(1) [0,1,2] will be [0,2]
     * @param index
     */
    deleteIndex = (index) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        else if (this.isReadOnly) {
            throw new Error(`Can't delete item from readonly array`);
        }
        this.values.splice(index, 1);
        this.emitChildChangeEvent(index);
    };
    /**
     * Delete item and splice an array
     * deleteItem(1) [0,1,2] will be [0,2]
     * @param value
     */
    deleteValue = (value) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        else if (this.isReadOnly) {
            throw new Error(`Can't delete item from readonly array`);
        }
        const index = this.values.indexOf(value);
        if (index < 0)
            return;
        this.values.splice(index, 1);
        this.emitChildChangeEvent(index);
    };
    ////// Standard methods
    // Methods which are mutate an array: push, pop, shift, unshift, fill, splice, reverse, sort
    push = (...items) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        const newLength = this.values.push(...items);
        for (const item of items) {
            // TODO: если передан super value
            //    надо подменить у него parent, path и слушать buble событий от него
            //    все его потомки должны обновить родительский path
        }
        // emit event for whole array
        this.emitMyEvent();
        return newLength;
    };
    pop = () => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        //const lastIndex = this.values.length - 1
        const res = this.values.pop();
        //this.emitChildChangeEvent(lastIndex)
        // emit event for whole array
        this.emitMyEvent();
        // TODO: нужно овязять super элемент и дестроить его
        return res;
    };
    shift = () => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        const res = this.values.shift();
        //this.emitChildChangeEvent(0)
        // emit event for whole array
        this.emitMyEvent();
        // TODO: нужно овязять super элемент и дестроить его
        return res;
    };
    unshift = (...items) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        const res = this.values.unshift(...items);
        // emit event for whole array
        this.emitMyEvent();
        // const arr = (new Array(items.length)).fill(true)
        //
        // // TODO: test
        // // rise events for all the new children
        // arr.forEach((el: true, index: number) => this.emitChildChangeEvent(index))
        // TODO: наверное надо инициализировать super value и проверить значения
        return res;
    };
    fill = (value, start, end) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        this.values.fill(value, start, end);
        // emit event for whole array
        this.emitMyEvent();
        // TODO: наверное надо проверить значения
        return this.proxyfiedInstance;
    };
    splice = (start, deleteCount, ...items) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        const res = this.values.splice(start, deleteCount, ...items);
        // emit event for whole array
        this.emitMyEvent();
        // TODO: нужно овязять super элемент и дестроить его
        return res;
    };
    reverse = () => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        const res = this.values.reverse();
        // emit event for whole array
        this.emitMyEvent();
        return res;
    };
    sort = (compareFn) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        this.values.sort(compareFn);
        // emit event for whole array
        this.emitMyEvent();
        return this.proxyfiedInstance;
    };
    // TODO: not mutable methods just copy:
    //  - filter
    //  - find
    //  - findIndex
    //  - findLast
    //  - findLastIndex
    //  - forEach
    //  - includes
    //  - indexOf
    //  - join
    //  - map
    //  - slice
    //  - toLocaleString
    //  - toString
    //  - reduce
    //  - reduceRight
    //  ???? flat, flatMap, keys, values, some, valueOf
    // not realize: concat, copyWithin, entries, every
    /*
     * Not mutate array methods: concat, copyWithin, entries, every, filter,
     *   find, findIndex, findLast, findLastIndex, flat, flatMap, forEach,
     *   includes, indexOf, join, keys, lastIndexOf, map, slice, toLocaleString,
     *   toString, values, valueOf, some, reduce, reduceRight
     */
    ///// PRIVATE
    /**
     * Set value of self readonly value and rise an event
     */
    myRoSetter = (index, newValue) => {
        this.setOwnValue(index, newValue, true);
    };
}
