import {newScope, SuperData} from "../../src/index.js";
import {SUPER_VALUE_EVENTS} from "../../src/lib/SuperValueBase.js";


describe.only('SuperData', () => {
  it('proxy', async () => {

    // TODO: review

    const scope = newScope()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'number'
        }
      },
    }
    const proxyfied = await scope.$run(def)

    proxyfied.$super.init()

    proxyfied.setValue('p1', 5)

    assert.equal(proxyfied['p1'], 5)

    proxyfied['p1'] = 6

    assert.equal(proxyfied['p1'], 6)
    assert.deepEqual(proxyfied, {p1: 6})

    assert.deepEqual({...proxyfied}, {p1: 6})
  })

  it('you have to initialize data first', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'number',
          default: 5
        }
      },
    }
    const data = await scope.$run(def)
    // from base class
    assert.throws(() => data.hasKey('p1'))
    assert.throws(() => data.getValue('p1'))
    assert.throws(() => data.setValue('p1', 6))
    assert.throws(() => data.setNull('p1'))
    assert.throws(() => data.clone())
    // from data
    assert.throws(() => data.getOwnValue('p1'))
    assert.throws(() => data.setOwnValue('p1', 7))
    assert.throws(() => data.$super.toDefaultValue('p1'))

    // TODO: add data specific
  })


  it('check definition', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'number',
          default: 5,
          nullable: true,
        },
        p2: {
          type: 'string',
        },
        p3: {
          type: 'string',
          default: 'd',
          readonly: false
        },
      },
      defaultRo: true
    }
    const data = await scope.$run(def)

    data.$super.init({p2: 'str'})

    assert.deepEqual(data, {p1: 5, p2: 'str', p3: 'd'})
    assert.deepEqual(data.$super.definition, {
      "$DEFAULT": {
        "nullable": false,
        "readonly": false,
        "required": false,
        "type": "any",
      },
      "p1": {
        "default": 5,
        "nullable": true,
        "readonly": true,
        "required": false,
        "type": "number",
      },
      "p2": {
        "readonly": true,
        "nullable": false,
        "required": false,
        "type": "string",
      },
      "p3": {
        "default": "d",
        "nullable": false,
        "readonly": false,
        "required": false,
        "type": "string",
      }
    })

    // TODO: add array like specific
  })

  it('default value', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'number',
          default: 5
        }
      },
    }
    const data = await scope.$run(def)

    data.subscribe(spy)
    data.$super.init()
    assert.equal(data['p1'], 5)
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(data.$super, undefined)
  })

  it('wrong default value', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'number',
          default: 'str'
        }
      },
    }

    let data

    try {
      data = await scope.$run(def)
    }
    catch (e) {
    }

    if (data) assert.fail('Shouldn\'t be ok')
  })

  it('wrong initial value', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'number',
        }
      },
    }
    const data = await scope.$run(def)

    data.subscribe(spy)

    assert.throws(() => data.$super.init({p1: 's'}))
    spy.should.have.not.been.called
  })

  it('not required value - will use initial value for type', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'number',
        }
      },
    }
    const data = await scope.$run(def)

    data.subscribe(spy)
    data.$super.init()

    assert.deepEqual(data, {p1: 0})
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(data.$super, undefined)
  })

  it('required value', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'number',
          required: true
        }
      },
    }
    const data = await scope.$run(def)

    data.subscribe(spy)
    data.$super.init({p1: 5})
    assert.deepEqual(data, {p1: 5})
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(data.$super, undefined)
  })

  it('required', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'number',
          required: true
        }
      },
    }
    const data = await scope.$run(def)

    data.subscribe(spy)

    assert.throws(() => data.$super.init())
    spy.should.have.not.been.called
  })

  it('readonly value - set initial and set via setter', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'number',
          readonly: true
        }
      },
    }
    const data = await scope.$run(def)

    data.subscribe(spy)

    const setter = data
      .$super.init({p1: 5})

    spy.should.have.been.calledOnce

    assert.deepEqual(data, {p1: 5})

    setter('p1', 6)

    assert.deepEqual(data, {p1: 6})
    // try to set by usual way
    assert.throws(() => data.setValue('p1', 7))
    // first time on init and the second time using setter
    spy.should.have.been.calledTwice
  })

  it('toDefaultValue - type\'s default', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'number',
        },
      },
    }
    const data = await scope.$run(def)

    data.$super.init()

    assert.deepEqual(data, {p1: 0})

    data.setValue('p1', 1)

    assert.deepEqual(data, {p1: 1})

    data.$super.toDefaultValue('p1')

    assert.deepEqual(data, {p1: 0})
  })

  it('little methods', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'number',
          readonly: true,
          default: 5
        },
        p2: {
          type: 'string',
          default: 's',
          nullable: true,
        }
      },
    }
    const data = await scope.$run(def)

    data.subscribe(spy)
    data.$super.init()

    spy.should.have.been.calledOnce
    assert.equal(data.getValue('p1'), 5)
    assert.equal(data.$super.getOwnValue('p1'), 5)
    assert.isTrue(data.$super.isKeyReadonly('p1'))
    assert.isTrue(data.$super.hasKey('p1'))
    assert.deepEqual(data.$super.ownKeys, ['p1', 'p2'])
    spy.should.have.been.calledOnce

    data.$super.setNull('p2')
    assert.isNull(data['p2'])
    spy.should.have.been.calledTwice

    data.$super.toDefaultValue('p2')
    assert.equal(data.$super.getOwnValue('p2'), 's')
    spy.should.have.been.calledThrice
    // set wrong value
    assert.throws(() => data.$super.setOwnValue('p2', 5))
    assert.throws(() => data.$super.setValue('p2', true))
    assert.throws(() => data.$super.setValue('p2'))

    spy.should.have.been.calledThrice
  })

  ///////// Smart definition work

  it('set and remove definition after init', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperData',
    }
    const data = await scope.$run(def)

    data.$super.init()

    data.$super.define('a1', {
      type: 'number',
      default: 5
    })

    assert.deepEqual(data, {a1: 5})
    assert.deepEqual(data.$super.ownKeys, ['a1'])
    data.$super.setOwnValue('a1', 6)
    assert.deepEqual(data, {a1: 6})
    data.$super.toDefaultValue('a1')
    assert.deepEqual(data, {a1: 5})
    // remove
    data.$super.forget('a1')
    assert.deepEqual(data, {})
    assert.deepEqual(data.$super.ownKeys, [])
    assert.isUndefined(data.$super.definition['a1'])
  })

  it('definition {type: any} by default', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperData',
    }
    const data = await scope.$run(def)

    data.$super.init()

    assert.deepEqual(data.$super.definition, {
      $DEFAULT: {
        "nullable": false,
        "readonly": false,
        "required": false,
        "type": "any"
      }
    })

    // set any value
    data.$super.setOwnValue('a1', 5)
    assert.deepEqual(data, {a1: 5})
  })

  it('no default definition if set null', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperData',
      definition: {
        $DEFAULT: null
      }
    }
    const data = await scope.$run(def)

    data.$super.init()

    assert.deepEqual(data.$super.definition, {})
    assert.throws(() => data.$super.setOwnValue('a1', 5))
  })

  it('setDefaultDefinition', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperData',
      definition: {
        $DEFAULT: null
      }
    }
    const data = await scope.$run(def)

    data.$super.init()

    assert.deepEqual(data.$super.definition, {})

    data.$super.setDefaultDefinition({
      type: 'number',
    })

    assert.throws(() => data.$super.setOwnValue('a1', 's'))
    data.$super.setOwnValue('a1', 5)
    assert.deepEqual(data, {a1: 5})
  })

  it('layers', async () => {
    const dataBottom = new SuperData()

    dataBottom.init({a: 1, b: 2})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.init({a: 5, c: 3})

    assert.deepEqual(dataBottom.ownValues, {a: 1, b: 2})
    assert.deepEqual(dataTop.ownValues, {a: 5, c: 3})
    assert.deepEqual(dataBottom.ownKeys, ['a', 'b'])
    assert.deepEqual(dataTop.ownKeys, ['a', 'c'])
    assert.deepEqual(dataTop.allKeys, ['a', 'b', 'c'])
    assert.deepEqual(dataTop.clone(), {a: 5, b: 2, c: 3})
    assert.equal(dataBottom.getValue('a'), 1)
    assert.equal(dataTop.getValue('a'), 5)
    assert.equal(dataTop.getValue('b'), 2)
    // delete var always from both layers
    dataTop.forget('a')
    assert.deepEqual(dataBottom.ownKeys, ['b'])
    assert.deepEqual(dataTop.ownKeys, ['c'])
    assert.deepEqual(dataTop.allKeys, ['b', 'c'])
    // setValue
    dataTop.setValue('a', 7)
    assert.deepEqual(dataBottom.allKeys, ['b'])
    assert.deepEqual(dataTop.ownKeys, ['c', 'a'])
    assert.deepEqual(dataTop.allKeys, ['b', 'c', 'a'])
    assert.isUndefined(dataBottom.getValue('a'))
    assert.equal(dataTop.getValue('a'), 7)
    assert.isFalse(dataBottom.hasKey('a'))
    assert.isTrue(dataTop.hasKey('a'))
    // setOwnValue
    dataTop.setOwnValue('d', 1)
    assert.isUndefined(dataBottom.getValue('d'))
    assert.equal(dataTop.getValue('d'), 1)
    assert.isFalse(dataBottom.hasKey('d'))
    assert.isTrue(dataTop.hasKey('d'))
    // define
    dataBottom.define('e', {type: "number", default: 2})
    dataTop.define('e', {type: "string", default: 's'})
    assert.equal(dataBottom.getValue('e'), 2)
    assert.equal(dataTop.getValue('e'), 's')
    dataTop.setValue('e', 'a')
    assert.equal(dataBottom.getValue('e'), 2)
    assert.equal(dataTop.getValue('e'), 'a')
  })

  it('layers deep', async () => {
    const dataBottom = new SuperData()

    dataBottom.init({a: {aa: 1}})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.init({a: {aa: 2}})

    assert.equal(dataBottom.getValue('a.aa'), 1)
    assert.equal(dataTop.getValue('a.aa'), 2)
    // update only top value
    dataTop.setValue('a.aa', 3)
    assert.equal(dataBottom.getValue('a.aa'), 1)
    assert.equal(dataTop.getValue('a.aa'), 3)
    // set another value to top
    dataTop.setValue('a.cc', 1)
    assert.isUndefined(dataBottom.getValue('a.cc'))
    assert.equal(dataTop.getValue('a.cc'), 1)
    assert.isFalse(dataBottom.hasKey('a.cc'))
    assert.isTrue(dataTop.hasKey('a.cc'))
  })

  it('get from bottom layer', async () => {
    const dataBottom = new SuperData()

    dataBottom.init({a: {}})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.init()

    dataBottom.setValue('a.bb', 1)
    assert.equal(dataBottom.getValue('a.bb'), 1)
    assert.equal(dataTop.getValue('a.bb'), 1)
    assert.isTrue(dataBottom.hasKey('a.bb'))
    assert.isTrue(dataTop.hasKey('a.bb'))
    // it will not work because "a" have value {} which makes a new tree
    dataTop.setOwnValue('a', {})
    assert.equal(dataBottom.getValue('a.bb'), 1)
    assert.isUndefined(dataTop.getValue('a.bb'))
    assert.isTrue(dataBottom.hasKey('a.bb'))
    assert.isFalse(dataTop.hasKey('a.bb'))
  })

  it('set to bottom layer from top if value has not defined on top', async () => {
    const dataBottom = new SuperData()

    dataBottom.init({a: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.init()

    dataTop.setValue('a', 2)

    assert.equal(dataBottom.getValue('a'), 2)
    assert.equal(dataTop.getValue('a'), 2)
    assert.isUndefined(dataTop.getOwnValue('a'))
  })

  it('deep super value', async () => {
    const dataBottom = new SuperData()
    const deepValue = new SuperData()

    deepValue.init({d: 1})
    dataBottom.init({a: deepValue.getProxy()})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.init()

    assert.equal(dataBottom.getValue('a.d'), 1)
    assert.equal(dataTop.getValue('a.d'), 1)
  })

  it('layers events whe set via top layer', async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spy1)
    dataBottom.init({a: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spy2)
    dataTop.init()

    dataTop.setValue('a', 2)

    assert.equal(dataBottom.getValue('a'), 2)
    assert.equal(dataTop.getValue('a'), 2)
    spy1.should.have.been.calledTwice
    // it have to rise an event too
    spy2.should.have.been.calledTwice
  })

  it('layers events whe set via bottom layer', async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spy1)
    dataBottom.init({a: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spy2)
    dataTop.init()

    dataBottom.setValue('a', 2)

    assert.equal(dataBottom.getValue('a'), 2)
    assert.equal(dataTop.getValue('a'), 2)
    spy1.should.have.been.calledTwice
    // it have to rise an event too
    spy2.should.have.been.calledTwice
  })

  ///////////// Simple deep children

  it('manipulate deep object without definition', async () => {
    const spy = sinon.spy()
    const sdata = (new SuperData()).getProxy()

    sdata.subscribe((target, path) => spy(path))
    sdata.$super.init({a: {b: 1}})

    assert.equal(sdata.getValue('a.b'), 1)
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(undefined)
    // set value
    sdata.setValue('a.b', 2)
    assert.equal(sdata.getValue('a.b'), 2)
    spy.should.have.been.calledTwice
    spy.should.have.been.calledWith('a.b')
  })

  it('manipulate deep object with definition', async () => {
    const spy = sinon.spy()
    const sdata = (new SuperData({
      a: {
        type: 'object',
        default: {
          b: 1
        }
      }
    })).getProxy()

    sdata.subscribe((target, path) => spy(path))
    sdata.$super.init()

    assert.equal(sdata.getValue('a.b'), 1)
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(undefined)
    // set value
    sdata.setValue('a.b', 2)
    assert.equal(sdata.getValue('a.b'), 2)
    spy.should.have.been.calledTwice
    spy.should.have.been.calledWith('a.b')
  })

  it('manipulate deep array without definition', async () => {
    const spy = sinon.spy()
    const sdata = (new SuperData()).getProxy()

    sdata.subscribe((target, path) => spy(path))
    sdata.$super.init({a: ['b']})

    assert.equal(sdata.getValue('a[0]'), 'b')
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(undefined)
    // set value
    sdata.setValue('a[0]', 'q')
    assert.equal(sdata.getValue('a[0]'), 'q')
    spy.should.have.been.calledTwice
    spy.should.have.been.calledWith('a[0]')
  })

  //////////// Super children

  it('children is SuperData', async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const rootDef = {
      ch: {
        type: 'SuperData'
      }
    }
    const rootProxy = (new SuperData(rootDef)).getProxy()
    const childProxy = (new SuperData()).getProxy()

    rootProxy.subscribe((target, path) => spy1(path))
    childProxy.subscribe((target, path) => spy2(path))
    childProxy.$super.init({a: 1})
    rootProxy.$super.init({ch: childProxy})

    assert.equal(rootProxy.getValue('ch.a'), 1)
    spy1.should.have.been.calledOnce
    spy2.should.have.been.calledOnce
    // set value to child
    rootProxy.setValue('ch.a', 2)
    assert.equal(rootProxy.getValue('ch.a'), 2)
    assert.equal(childProxy.getValue('a'), 2)
    spy1.should.have.been.calledTwice
    spy2.should.have.been.calledTwice
    spy1.should.have.been.calledWith(undefined)
    spy2.should.have.been.calledWith(undefined)
    spy1.should.have.been.calledWith('ch.a')
    spy2.should.have.been.calledWith('ch.a')
  })

  it('children is SuperData - no definition', async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const rootProxy = (new SuperData()).getProxy()
    const childProxy = (new SuperData()).getProxy()

    rootProxy.subscribe((target, path) => spy1(path))
    childProxy.subscribe((target, path) => spy2(path))
    childProxy.$super.init({a: 1})
    rootProxy.$super.init({ch: childProxy})

    assert.equal(rootProxy.getValue('ch.a'), 1)
    spy1.should.have.been.calledOnce
    spy2.should.have.been.calledOnce
    // set value to child
    rootProxy.setValue('ch.a', 2)
    assert.equal(rootProxy.getValue('ch.a'), 2)
    assert.equal(childProxy.getValue('a'), 2)
    spy1.should.have.been.calledTwice
    spy2.should.have.been.calledTwice
  })

  it('destroy', async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const rootProxy = (new SuperData()).getProxy()
    const childProxy = (new SuperData()).getProxy()

    rootProxy.$super.events.addListener(SUPER_VALUE_EVENTS.destroy, spy1)
    childProxy.$super.events.addListener(SUPER_VALUE_EVENTS.destroy, spy2)
    childProxy.$super.init({a: 1})
    rootProxy.$super.init({ch: childProxy})

    rootProxy.$super.destroy()

    assert.isTrue(rootProxy.$super.isDestroyed)
    assert.isTrue(childProxy.$super.isDestroyed)
    spy1.should.have.been.calledOnce
    spy2.should.have.been.calledOnce
  })

  it('execute expressions - deep array', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'array',
        },
      },
    }
    const data = await scope.$run(def)

    data.subscribe(spy)
    data.$super.init()

    await data.$super.execute(newScope({scopeVal: 2}), {
      p1: [
        [
          {
            $exp: 'getValue',
            path: 'scopeVal',
          }
        ]
      ]
    })

    assert.deepEqual(data.getValue('p1'), [[2]])
    spy.should.have.been.calledTwice
  })

  it('execute expressions - deep obj - no definition', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const data = await scope.$run({
      $exp: 'newSuperData'
    })

    data.subscribe(spy)
    data.$super.init()

    await data.$super.execute(newScope({scopeVal: {a: 2}}), {
      p1: [
        {
          $exp: 'getValue',
          path: 'scopeVal',
        }
      ]
    })

    assert.deepEqual(data.getValue('p1'), [{a: 2}])
    spy.should.have.been.calledTwice
  })

  it('execute expressions - layers, the same key', async () => {
    const spyBottom = sinon.spy()
    const spyTop = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spyBottom)
    dataBottom.init({a: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spyTop)
    dataTop.init()

    await dataTop.execute(newScope({scopeVal: 2}), {
      a: {
        $exp: 'getValue',
        path: 'scopeVal',
      }
    })

    assert.equal(dataBottom.getValue('a'), 1)
    assert.equal(dataTop.getValue('a'), 2)
    spyBottom.should.have.been.calledOnce
    spyTop.should.have.been.calledTwice
  })

  it('execute expressions - layers, new key', async () => {
    const spyBottom = sinon.spy()
    const spyTop = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spyBottom)
    dataBottom.init({a: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spyTop)
    dataTop.init()

    await dataTop.execute(newScope({scopeVal: 2}), {
      b: {
        $exp: 'getValue',
        path: 'scopeVal',
      }
    })

    assert.equal(dataBottom.getValue('a'), 1)
    assert.isUndefined(dataBottom.getValue('b'))
    assert.equal(dataTop.getValue('a'), 1)
    assert.equal(dataTop.getValue('b'), 2)
    spyBottom.should.have.been.calledOnce
    spyTop.should.have.been.calledTwice
  })

  it(`execute expressions - layers, bottom has key which top doesn't have`, async () => {
    const spyBottom = sinon.spy()
    const spyTop = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spyBottom)
    dataBottom.init({b: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spyTop)
    dataTop.init({a: 1})

    await dataTop.execute(newScope({scopeVal: 2}), {
      a: {
        $exp: 'getValue',
        path: 'scopeVal',
      }
    })

    assert.isUndefined(dataBottom.getValue('a'))
    assert.equal(dataBottom.getValue('b'), 1)
    assert.equal(dataTop.getValue('a'), 2)
    assert.equal(dataTop.getValue('b'), 1)
    spyBottom.should.have.been.calledOnce
    spyTop.should.have.been.calledTwice
  })

  it(`execute expressions - new top value`, async () => {
    const spyBottom = sinon.spy()
    const spyTop = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spyBottom)
    dataBottom.init({b: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spyTop)
    dataTop.init()

    await dataTop.execute(newScope({scopeVal: 2}), {
      a: {
        $exp: 'getValue',
        path: 'scopeVal',
      }
    })

    assert.isUndefined(dataBottom.getValue('a'))
    assert.equal(dataBottom.getValue('b'), 1)
    assert.equal(dataTop.getValue('a'), 2)
    assert.equal(dataTop.getValue('b'), 1)
    spyBottom.should.have.been.calledOnce
    spyTop.should.have.been.calledTwice
  })

  it(`execute expressions - deep layers`, async () => {
    const spyBottom = sinon.spy()
    const spyTop = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spyBottom)
    dataBottom.init({a: {aa: 1, bb: 1}})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spyTop)
    dataTop.init()

    await dataTop.execute(newScope({scopeVal: 2}), {
      a: {
        aa: {
          $exp: 'getValue',
          path: 'scopeVal',
        }
      }
    })

    assert.deepEqual(dataBottom.getValue('a'), {aa: 1, bb: 1})
    assert.deepEqual(dataTop.getValue('a'), {aa: 2, bb: 1})
    spyBottom.should.have.been.calledOnce
    spyTop.should.have.been.calledTwice
  })

  // TODO: потомок - super func
  // TODO: потомок - simple func
  // TODO: потомок - jsExp
  // TODO: потомок - forEach ???
  // TODO: потомок - ifElse ???



  // TODO: с учётом порядка ключей
  // it('clone', async () => {
  //   const scope = newScope()
  //   const spy = sinon.spy()
  //   const def = {
  //     $exp: 'newSuperData',
  //     definition: {
  //       p1: {
  //         type: 'number',
  //         default: 5
  //       },
  //     },
  //   }
  //   const data = await scope.$run(def)
  //
  //   data.$super.init()
  //
  //   const cloned = data.$super.clone()
  //
  //   data.setValue('p1', 6)
  //
  //   assert.deepEqual(cloned, {p1: 5})
  // })


  // TODO: можно сортировать ключи
  // TODO: test batchSet
  // TODO: add ability to delete array value
  // TODO: проверить getValue, setValue будут ли они работать если ключ это число???
  // TODO: makeChildPath не верно отработает если дадут число
  // TODO: если есть full ro у родителя то должен установить ro у детей а те у своих детей
  // TODO: test removeChildListeners()
  // TODO: test all the events
  // TODO: test toDefaultValue when child is super data
  // TODO: test batchSet
  // TODO: test array like
  // TODO: test init array like values
  // TODO: если отсоединить потомка от другого родителя то у него может
  //       нарушиться целостность, так как он может быть обязательным в struct
  //       или быть required
  //       можно сделать явную проверку и поднять ошибку

})
