import {newScope, SuperStruct} from "../../src/index.js";


// TODO: check наслоедование ro для потомков
// TODO: без инициализации ничего не должно работать
// TODO: ловить события

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

  it('default value', async () => {
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
    struct.$super.init()
    assert.equal(struct['p1'], 5)
  })

  it('wrong default value', async () => {
    const scope = newScope()
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
    assert.throws(() => struct.$super.init())
  })

  it('not required value', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newSuperStruct',
      definition: {
        p1: {
          type: 'number',
        }
      },
    }
    const struct = await scope.$run(def)
    struct.$super.init()
    assert.deepEqual(struct, {p1: undefined})
  })

  it('required value', async () => {
    const scope = newScope()
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
    struct.$super.init({p1: 5})
    assert.deepEqual(struct, {p1: 5})
  })

  it('bad required value', async () => {
    const scope = newScope()
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
    assert.throws(() => struct.$super.init())
  })

  it('readonly value - set initial and set via setter', async () => {
    const scope = newScope()
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
    const setter = struct
      .$super.init({p1: 5})

    assert.deepEqual(struct, {p1: 5})

    setter('p1', 6)

    assert.deepEqual(struct, {p1: 6})

    assert.throws(() => struct.setValue('p1', 7))
  })

})
