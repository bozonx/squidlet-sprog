import {newScope, SuperStruct} from "../../src/index.js";


// TODO: link
// TODO: unlink


describe('SuperStruct', () => {
  it('proxy', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperStruct',
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

  it('you have to initialize struct first', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperStruct',
      definition: {
        p1: {
          type: 'number',
          default: 5
        }
      },
    }
    const struct = await scope.$run(def)
    // from base class
    assert.throws(() => struct.hasKey('p1'))
    assert.throws(() => struct.getValue('p1'))
    assert.throws(() => struct.setValue('p1', 6))
    assert.throws(() => struct.setNull('p1'))
    assert.throws(() => struct.clone())
    // from struct
    assert.throws(() => struct.myKeys())
    assert.throws(() => struct.getOwnValue('p1'))
    assert.throws(() => struct.setOwnValue('p1', 7))
    assert.throws(() => struct.toDefaultValue('p1'))
  })

  it('set default ro', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperStruct',
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
    const struct = await scope.$run(def)

    struct.$super.init({p2: 'str'})

    assert.deepEqual(struct, {p1: 5, p2: 'str', p3: 'd'})
    assert.deepEqual(struct.$super.definition, {
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
      $exp: 'newSuperStruct',
      definition: {
        p1: {
          type: 'number',
          default: 5
        }
      },
    }
    const struct = await scope.$run(def)

    struct.subscribe(spy)
    struct.$super.init()
    assert.equal(struct['p1'], 5)
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(struct.$super, undefined)
  })

  it('wrong default value', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperStruct',
      definition: {
        p1: {
          type: 'number',
          default: 'str'
        }
      },
    }
    const struct = await scope.$run(def)

    struct.subscribe(spy)

    assert.throws(() => struct.$super.init())
    spy.should.have.not.been.called
  })

  it('not required value', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperStruct',
      definition: {
        p1: {
          type: 'number',
        }
      },
    }
    const struct = await scope.$run(def)

    struct.subscribe(spy)
    struct.$super.init()

    assert.deepEqual(struct, {p1: undefined})
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(struct.$super, undefined)
  })

  it('required value', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperStruct',
      definition: {
        p1: {
          type: 'number',
          required: true
        }
      },
    }
    const struct = await scope.$run(def)

    struct.subscribe(spy)
    struct.$super.init({p1: 5})
    assert.deepEqual(struct, {p1: 5})
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(struct.$super, undefined)
  })

  it('bad required value', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperStruct',
      definition: {
        p1: {
          type: 'number',
          required: true
        }
      },
    }
    const struct = await scope.$run(def)

    struct.subscribe(spy)

    assert.throws(() => struct.$super.init())
    spy.should.have.not.been.called
  })

  it('readonly value - set initial and set via setter', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperStruct',
      definition: {
        p1: {
          type: 'number',
          readonly: true
        }
      },
    }
    const struct = await scope.$run(def)

    struct.subscribe(spy)

    const setter = struct
      .$super.init({p1: 5})

    spy.should.have.been.calledOnce

    assert.deepEqual(struct, {p1: 5})

    setter('p1', 6)

    assert.deepEqual(struct, {p1: 6})
    assert.throws(() => struct.setValue('p1', 7))
    // first time on init and the second time using setter
    spy.should.have.been.calledTwice
  })

  it('little methods', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperStruct',
      definition: {
        p1: {
          type: 'number',
          readonly: true,
          default: 5
        },
        p2: {
          type: 'string',
          default: 's'
        }
      },
    }
    const struct = await scope.$run(def)

    struct.subscribe(spy)
    struct.$super.init()

    spy.should.have.been.calledOnce
    assert.equal(struct.getValue('p1'), 5)
    assert.equal(struct.$super.getOwnValue('p1'), 5)
    assert.isTrue(struct.$super.isKeyReadonly('p1'))
    assert.isTrue(struct.$super.hasKey('p1'))
    assert.deepEqual(struct.$super.myKeys(), ['p1', 'p2'])

    spy.should.have.been.calledOnce

    // TODO: setNull
    // struct.$super.setNull('p2')
    //
    // assert.isNull(struct['p2'])

    struct.$super.toDefaultValue('p2')

    assert.equal(struct.$super.getOwnValue('p2'), 's')
  })

})

// TODO: toDefaultValue

// TODO: setValue, setOwnValue - не своего типа
// TODO: clone
