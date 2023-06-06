import {newScope} from "../../src/index.js";


describe('forEach', () => {
  it('common check', async () => {
    const scope = newScope({topVal: 1})

    await scope.$run({
      $exp: 'forEach',
    })
  })
})
