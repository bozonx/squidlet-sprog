import {newScope, SuperStruct} from "../../src/index.js";


describe('SuperStruct', () => {
  it('proxy', () => {
    const scope = newScope()
    const def = {
      p1: {
        type: 'number'
      }
    }
    const struct = new SuperStruct(scope, def)
    const proxyfied = struct.getProxy()

    proxyfied.setValue('p1', 5)

    assert.equal(proxyfied['p1'], 5)

    proxyfied['p1'] = 6

    assert.equal(proxyfied['p1'], 6)
    assert.deepEqual(proxyfied, {p1: 6})

    assert.deepEqual({...proxyfied}, {p1: 6})
  })

})
