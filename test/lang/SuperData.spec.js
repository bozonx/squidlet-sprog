import {newScope, SuperData} from "../../src/index.js";


describe('SuperData', () => {
  it('proxy', async () => {
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

  it(`toDefaultValue - type's default`, async () => {
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

  it(`toDefaultValue - child is Super Data`, async () => {
    const scope = newScope()
    const child = (new SuperData({
      ca: {
        type: 'number',
        default: 1,
      }
    })).getProxy()
    const data = await scope.$run({
      $exp: 'newSuperData',
      definition: {
        a: {
          type: 'SuperData',
        },
      },
    })

    child.$super.init({ca: 2})
    data.$super.init({a: child})

    assert.deepEqual(child, {ca: 2})
    assert.deepEqual(data, {a: child})

    data.$super.toDefaultValue('a')

    assert.deepEqual(child, {ca: 1})
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
    // set undefined
    assert.doesNotThrow(() => data.$super.setValue('p2'))

    spy.should.have.been.callCount(4)
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

  it('clone', async () => {
    const scope = newScope()
    const data = await scope.$run({
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'number',
          default: 5
        },
      },
    })

    data.$super.init()

    const cloned = data.$super.clone()

    data.setValue('p1', 6)

    assert.deepEqual(cloned, {p1: 5})
  })

  it('getDefinition - get from bottom layer even top has default definition', async () => {
    const dataBottom = new SuperData({
      a: {
        type: 'number',
        default: 5,
      },
    })

    dataBottom.init({a: 1})

    const dataTop = new SuperData(
      {
        $DEFAULT: {
          type: 'number'
        },
      },
      undefined,
      dataBottom
    )

    dataTop.init({a: 2})

    assert.deepEqual(dataTop.getDefinition('a'), {
      type: 'number',
      default: 5,
      nullable: false,
      readonly: false,
      required: false,
    })

    dataBottom.forget('a')

    assert.deepEqual(dataTop.getDefinition('a'), {
      type: 'number',
      nullable: false,
      readonly: false,
      required: false,
    })
  })

})
