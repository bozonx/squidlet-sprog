import {newScope, SuperData} from "../../src/index.js";


describe('SuperData', () => {
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
    // const proxyfied = await scope.$run(def)
    //
    // proxyfied.$super.init()
    //
    // proxyfied.setValue('p1', 5)
    //
    // assert.equal(proxyfied['p1'], 5)
    //
    // proxyfied['p1'] = 6
    //
    // assert.equal(proxyfied['p1'], 6)
    // assert.deepEqual(proxyfied, {p1: 6})
    //
    // assert.deepEqual({...proxyfied}, {p1: 6})
  })

})
