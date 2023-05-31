import {newScope, SuperStruct} from "../../src/index.js";


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

  // TODO: chech initial value
  // TODO: chech bad initial value
  // TODO: chech required
  // TODO: chech ro
  // TODO: check наслоедование ro для потомков
  // TODO: без инициализации ничего не должно работать

})
