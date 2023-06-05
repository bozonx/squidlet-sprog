import {newScope} from "../../src/index.js";
import {newSuperFunc} from "../../src/lang/superFunc.js";


describe('superFunc', () => {
  it('newSuperFunc', async () => {
    const scope = newScope()
    const func = await scope.$run({
      $exp: 'newSuperFunc',
      props: {
        p1: { type: 'number' }
      },
      lines: []
    })

    //func.$super.init()


  })

})
