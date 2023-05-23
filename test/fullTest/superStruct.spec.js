import {
  // TODO: а оно надо??? может плоской сделать?
  sprogFuncs,
  newScope
} from "../../src/index.js"


describe('Full test. Super struct', () => {
  it('manipulate primitive values', async () => {
    const definition = {
      a1: {
        type: 'string'
      }
    }
    const scope = newScope()
    const ss = await sprogFuncs.newSuperStruct(scope)({
      definition,
    })

    console.log(333, ss)

    ss.$super.init({a1: 'init'})

    assert.deepEqual(ss.$super.clone(), {a1: 'init'})


  })
})
