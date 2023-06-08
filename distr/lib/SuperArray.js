import { arrayKeys, spliceItem, omitObj } from 'squidlet-lib';
import { SUPER_PROXY_PUBLIC_MEMBERS, SUPER_VALUE_EVENTS, SUPER_VALUE_PROP, SuperValueBase } from './SuperValueBase.js';
import { All_TYPES, SIMPLE_TYPES } from '../types/valueTypes.js';
import { isCorrespondingType } from './isCorrespondingType.js';
import { DEFAULT_INIT_SUPER_DEFINITION, } from '../types/SuperItemDefinition.js';
import { resolveInitialSimpleValue } from './helpers.js';
const ARR_PUBLIC_MEMBERS = [
    ...SUPER_PROXY_PUBLIC_MEMBERS,
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
];
/**
 * Wrapper for super array which allows to manipulate it as common array.
 * And it puts some methods to it:
 * * arr.$super - instance of SuperArray
 * * arr... - see other methods in ARR_PUBLIC_MEMBERS
 * @param arr
 */
export function proxifyArray(arr) {
    const handler = {
        get(target, prop) {
            if (prop === SUPER_VALUE_PROP) {
                return arr;
            }
            else if (typeof prop === 'string' && ARR_PUBLIC_MEMBERS.includes(prop)) {
                // public SuperArray prop
                return arr[prop];
            }
            else {
                // some other prop
                if (typeof prop === 'symbol') {
                    return arr.values[prop];
                }
                else {
                    // means number as string
                    const index = Number(prop);
                    if (Number.isInteger(index)) {
                        if (index < 0) {
                            // Support negative indices (e.g., -1 for last element)
                            prop = String(arr.length + index);
                        }
                        return arr.values[index];
                    }
                    // some other prop - get it from the array
                    return arr.values[prop];
                }
            }
        },
        set(target, prop, value) {
            // Intercept array element assignment
            const index = Number(prop);
            if (Number.isInteger(index)) {
                if (index < 0) {
                    // Support negative indices (e.g., -1 for last element)
                    prop = String(arr.length + index);
                }
                // set value and rise an event
                return arr.setOwnValue(index, value);
            }
            // Set the usual array properties and methods
            arr.values[index] = value;
            return true;
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
    get itemDefinition() {
        return { ...this.definition, required: false };
    }
    get ownKeys() {
        return arrayKeys(this.values);
    }
    constructor(definition) {
        super();
        this.checkDefinition(definition);
        this.definition = {
            ...omitObj(DEFAULT_INIT_SUPER_DEFINITION, 'required'),
            ...definition,
        };
    }
    /**
     * Init with initial values.
     * It returns setter for readonly params
     */
    init = (initialArr) => {
        if (this.inited) {
            throw new Error(`The array has been already initialized`);
        }
        this.events.emit(SUPER_VALUE_EVENTS.initStart);
        // set initial values
        const initArrLength = initialArr?.length || 0;
        const defaultArrLength = this.definition.defaultArray?.length || 0;
        const maxLength = Math.max(initArrLength, defaultArrLength);
        const indexArr = (new Array(maxLength)).fill(true);
        // Any way set length to remove odd items. Actually init is allowed to run only once
        // so there should aren't any initialized super values in the rest of array
        this.values.length = maxLength;
        indexArr.forEach((el, index) => {
            // if index is in range of initalArr then get its item otherwise get from defaultArray
            const value = (index < initArrLength)
                ? initialArr?.[index]
                : this.definition.defaultArray?.[index];
            const childDefinition = {
                type: this.definition.type,
                default: (this.definition.defaultArray)
                    ? this.definition.defaultArray[index]
                    : this.definition.default,
                readonly: this.definition.readonly,
                nullable: this.definition.nullable,
                required: false,
            };
            this.values[index] = this.resolveChildValue(childDefinition, index, value);
        });
        return super.init();
    };
    destroy = () => {
        super.destroy();
        const values = this.values;
        for (const indexStr of values) {
            if (typeof values[indexStr] === 'object' && values[indexStr].destroy) {
                values[indexStr].destroy();
            }
        }
    };
    /**
     * Listen only to add, remove or reorder array changes
     */
    onArrayChange(handler) {
        return this.events.addListener(SUPER_VALUE_EVENTS.change, (el) => {
            if (el === this)
                handler();
        });
    }
    isKeyReadonly(key) {
        return this.isReadOnly;
    }
    getOwnValue(key) {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        return this.values[key];
    }
    setOwnValue(key, value, ignoreRo = false) {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        const index = Number(key);
        this.values[index] = this.resolveChildValue(this.itemDefinition, index, value);
        this.emitChildChangeEvent(index);
        return true;
    }
    /**
     * Set default value of array or undefined if there isn't any default value
     * @param index
     */
    toDefaultValue = (index) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        let defaultValue = (this.definition.defaultArray)
            ? this.definition.defaultArray[index]
            : this.definition.default;
        // TODO: а если super type??? То надо вызвать default value у него ???
        //       или ничего не делать? Если менять заного то надо дестроить предыдущий
        if (Object.keys(SIMPLE_TYPES).includes(this.definition.type)
            && typeof defaultValue === 'undefined') {
            defaultValue = resolveInitialSimpleValue(this.definition.type, this.definition.nullable);
        }
        this.setOwnValue(index, defaultValue);
    };
    getProxy() {
        return super.getProxy();
    }
    ///// Array specific methods
    /**
     * Clear item in array but not remove index
     * clearItem(1) [0,1,2] will be [0, empty, 2]
     * getting of arr[1] will return undefined
     * @param index
     */
    clearItem = (index) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        else if (this.isReadOnly) {
            throw new Error(`Can't delete item from readonly array`);
        }
        delete this.values[index];
        this.emitChildChangeEvent(index);
    };
    /**
     * Delete item and splice an array
     * deleteItem(1) [0,1,2] will be [0,2]
     * @param index
     * @param ignoreRo
     */
    deleteItem = (index, ignoreRo = false) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        else if (!ignoreRo && this.isReadOnly) {
            throw new Error(`Can't delete item from readonly array`);
        }
        // TODO: в тестах не учавствует
        spliceItem(this.values, index);
        this.emitChildChangeEvent(index);
    };
    getDefinition(index) {
        return this.definition;
    }
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
    checkDefinition(definition) {
        const { type, default: defaultValue, defaultArray, nullable, readonly, } = definition;
        if (type && !Object.keys(All_TYPES).includes(type)) {
            throw new Error(`Wrong type of SuperArray child: ${type}`);
        }
        else if (typeof nullable !== 'undefined' && typeof nullable !== 'boolean') {
            throw new Error(`nullable has to be boolean`);
        }
        else if (typeof readonly !== 'undefined' && typeof readonly !== 'boolean') {
            throw new Error(`readonly has to be boolean`);
        }
        else if (defaultValue && !isCorrespondingType(defaultValue, type, nullable)) {
            throw new Error(`Default value ${defaultValue} of SuperArray doesn't meet type: ${type}`);
        }
        else if (defaultArray) {
            if (!Array.isArray(defaultArray)) {
                throw new Error(`defaultArray has to be an array`);
            }
            else if (defaultArray.findIndex((el) => !isCorrespondingType(el, type, nullable)) >= 0) {
                throw new Error(`wrong defaultArray`);
            }
        }
    }
}
