import {omitObj} from "squidlet-lib";
import {newScope} from "../../src/index.js";
import {getValue} from "../../src/lang/deepValue.js";


describe('deepValue', () => {
  it('getValue and setValue deeply', async () => {
    const scope = newScope({v1: {}})
    // set
    await scope.$run({
      $exp: 'setValue',
      path: 'v1.v2',
      value: 5,
    })
    // get
    assert.deepEqual(omitObj(scope, 'std'), {v1: {v2: 5}})
    assert.equal(await scope.$run({
      $exp: 'getValue',
      path: 'v1.v2',
    }), 5)

    // await scope.$run({
    //   $exp: 'deleteValue',
    //   path: 'v1.v2',
    // })
    //
    // assert.deepEqual(omitObj(scope, 'std'), {v1: {}})
  })
})
