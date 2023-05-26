import { omitObj } from 'squidlet-lib';
import { SuperValueBase, isSuperValue, SUPER_VALUE_PROP, SUPER_PROXY_PUBLIC_MEMBERS } from './SuperValueBase.js';
import { isCorrespondingType } from './isCorrespondingType.js';
export const STRUCT_PUBLIC_MEMBERS = [
    ...SUPER_PROXY_PUBLIC_MEMBERS,
    'isStruct',
];
/**
 * Wrapper for SuperStruct which allows to manipulate it as common object.
 * And it puts some methods to it:
 * * arr.$super - instance of SuperStruct
 * * arr... - see other methods in STRUCT_PUBLIC_MEMBERS
 */
export function proxyStruct(struct) {
    const handler = {
        get(target, prop) {
            if (prop === SUPER_VALUE_PROP) {
                return struct;
            }
            else if (STRUCT_PUBLIC_MEMBERS.includes(prop)) {
                // public super struct prop
                return struct[prop];
            }
            // else prop or object itself
            return struct.values[prop];
        },
        has(target, prop) {
            if (prop === SUPER_VALUE_PROP || STRUCT_PUBLIC_MEMBERS.includes(prop)) {
                return true;
            }
            return Object.keys(struct.values).includes(prop);
        },
        set(target, prop, newValue) {
            struct.setOwnValue(prop, newValue);
            return true;
        },
        deleteProperty(target, p) {
            throw new Error(`It isn't possible to delete struct value`);
        },
        ownKeys(target) {
            return Object.keys(omitObj(struct.values, SUPER_VALUE_PROP));
        },
        // TODO: запретить переопределять методы struct
        // defineProperty?(target: T, property: string | symbol, attributes: PropertyDescriptor): boolean;
        // getOwnPropertyDescriptor?(target: T, p: string | symbol): PropertyDescriptor | undefined;
    };
    return new Proxy(struct.values, handler);
}
export class SuperStruct extends SuperValueBase {
    isStruct = true;
    // It assumes that you will not change it after initialization
    definition = {};
    // current values
    values = {};
    proxyFn = proxyStruct;
    constructor(scope, definition, defaultRo = false) {
        super(scope);
        this.definition = this.prepareDefinition(definition, defaultRo);
    }
    /**
     * Init with initial values.
     * It returns setter for readonly params
     */
    init = (initialValues) => {
        if (this.inited) {
            throw new Error(`The struct has been already initialized`);
        }
        // set initial values
        for (const keyStr of Object.keys(this.definition)) {
            const keyName = keyStr;
            this.values[keyName] = this.initChild(this.definition[keyName], keyStr, initialValues?.[keyName]);
        }
        // check required values
        for (const keyStr of Object.keys(this.definition)) {
            const keyName = keyStr;
            if (this.definition[keyName].required && typeof this.values[keyName] === 'undefined') {
                throw new Error(`The value ${keyStr} is required, but it wasn't initiated`);
            }
        }
        return super.init();
    };
    destroy = () => {
        super.destroy();
        for (const key of Object.keys(this.values)) {
            const keyName = key;
            if (isSuperValue(this.values[keyName])) {
                this.values[keyName].destroy();
            }
        }
    };
    isKeyReadonly(key) {
        return Boolean(this.definition?.[key].readonly);
    }
    myKeys() {
        return Object.keys(this.values);
    }
    getOwnValue(key) {
        return this.values[key];
    }
    setOwnValue(key, value, ignoreRo = false) {
        const name = key;
        if (typeof this.definition[name] === 'undefined') {
            throw new Error(`Can't set value with name ${String(name)} which isn't defined in definition`);
        }
        else if (!ignoreRo && this.definition[name].readonly) {
            throw new Error(`Can't set readonly value of name ${String(name)}`);
        }
        else if (!isCorrespondingType(value, this.definition[name].type)) {
            throw new Error(`The value ${String(name)} is not corresponding type ${this.definition[name].type}`);
        }
        // TODO: наверное проверить required чтобы не устанавливали undefined and null
        this.values[name] = value;
        this.riseChildrenChangeEvent(key);
    }
    /**
     * Set default value or null if the key doesn't have a default value
     * @param key
     */
    toDefaultValue = (key) => {
        const defaultValue = this.definition[key]?.default || null;
        this.setOwnValue(key, defaultValue);
    };
    getProxy() {
        return super.getProxy();
    }
    /**
     * Set value of self readonly value and rise an event
     */
    myRoSetter = (name, newValue) => {
        this.setOwnValue(name, newValue, true);
        this.riseChildrenChangeEvent(name);
    };
    prepareDefinition(definition, defaultRo) {
        const res = {};
        for (const keyStr of Object.keys(definition)) {
            const keyName = keyStr;
            res[keyName] = {
                ...definition[keyName],
                required: Boolean(definition[keyName].required),
                readonly: (defaultRo)
                    ? definition[keyName].readonly !== false
                    : Boolean(definition[keyName].readonly),
            };
        }
        return res;
    }
}
