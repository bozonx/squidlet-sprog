import {newScope, SuperData} from "../../src/index.js";


describe('SuperData', () => {
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
    assert.throws(() => data.myKeys())
    assert.throws(() => data.getOwnValue('p1'))
    assert.throws(() => data.setOwnValue('p1', 7))
    assert.throws(() => data.toDefaultValue('p1'))

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

    data.toDefaultValue('p1')

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
    assert.deepEqual(data.$super.myKeys(), ['p1', 'p2'])
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
    assert.deepEqual(data.$super.myKeys(), ['a1'])
    data.$super.setOwnValue('a1', 6)
    assert.deepEqual(data, {a1: 6})
    data.$super.toDefaultValue('a1')
    assert.deepEqual(data, {a1: 5})
    // remove
    data.$super.forget('a1')
    assert.deepEqual(data, {})
    assert.deepEqual(data.$super.myKeys(), [])
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
    const scope = {}
    const dataBottom = new SuperData(scope)

    dataBottom.init({a: 1, b: 2})

    const dataTop = new SuperData(
      scope,
      undefined,
      undefined,
      dataBottom
    )

    dataTop.init({a: 5, c: 3})

    assert.deepEqual(dataBottom.ownValues, {a: 1, b: 2})
    assert.deepEqual(dataTop.ownValues, {a: 5, c: 3})
    assert.deepEqual(dataBottom.myKeys(), ['a', 'b'])
    assert.deepEqual(dataTop.myKeys(), ['a', 'c'])
    assert.deepEqual(dataTop.allKeys(), ['a', 'b', 'c'])
    assert.deepEqual(dataTop.clone(), {a: 5, b: 2, c: 3})
    assert.equal(dataBottom.getValue('a'), 1)
    assert.equal(dataTop.getValue('a'), 5)
    assert.equal(dataTop.getValue('b'), 2)
    // delete var always from both layers
    dataTop.forget('a')
    assert.deepEqual(dataBottom.myKeys(), ['b'])
    assert.deepEqual(dataTop.myKeys(), ['c'])
    assert.deepEqual(dataTop.allKeys(), ['b', 'c'])
    // setValue
    dataTop.setValue('a', 7)
    assert.deepEqual(dataBottom.allKeys(), ['b'])
    assert.deepEqual(dataTop.myKeys(), ['c', 'a'])
    assert.deepEqual(dataTop.allKeys(), ['b', 'c', 'a'])
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
    const scope = {}
    const dataBottom = new SuperData(scope)

    dataBottom.init({a: {aa: 1}})

    const dataTop = new SuperData(
      scope,
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
    const scope = {}
    const dataBottom = new SuperData(scope)

    dataBottom.init({a: {}})

    const dataTop = new SuperData(
      scope,
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
    const scope = {}
    const dataBottom = new SuperData(scope)

    dataBottom.init({a: 1})

    const dataTop = new SuperData(
      scope,
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
    const scope = {}
    const dataBottom = new SuperData(scope)
    const deepValue = new SuperData(scope)

    deepValue.init({d: 1})
    dataBottom.init({a: deepValue.getProxy()})

    const dataTop = new SuperData(
      scope,
      undefined,
      undefined,
      dataBottom
    )

    dataTop.init()

    assert.equal(dataBottom.getValue('a.d'), 1)
    assert.equal(dataTop.getValue('a.d'), 1)
  })

  it('layers events', async () => {
    const scope = {}
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const dataBottom = new SuperData(scope)

    dataBottom.subscribe(spy1)
    dataBottom.init({a: 1})

    const dataTop = new SuperData(
      scope,
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

  // TODO: test all the events
  // TODO: test default definition
  // TODO: test array like
  // TODO: test init array like values

})
