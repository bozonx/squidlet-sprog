import {newScope, SuperData} from "../../src/index.js";


describe('SuperValueBase', () => {
  it.only('removeChildListeners', async () => {
    const scope = newScope()
    // const def = {
    //   $exp: 'newSuperData',
    //   definition: {
    //     p1: {
    //       type: 'number',
    //       default: 5,
    //       nullable: true,
    //     },
    //     p2: {
    //       type: 'string',
    //     },
    //     p3: {
    //       type: 'string',
    //       default: 'd',
    //       readonly: false
    //     },
    //   },
    //   defaultRo: true
    // }
    // const data = await scope.$run(def)
    //
    // data.$super.init({p2: 'str'})
    //
    // assert.deepEqual(data, {p1: 5, p2: 'str', p3: 'd'})
  })

})
