import {newScope} from "../../src/index.js";
import {logicAnd} from "../../src/lang/booleanLogic.js";


describe('booleanLogic', () => {
  it('logicAnd simple. true', async () => {
    const scope = newScope()
    const res = await scope.$run({
      $exp: 'logicAnd',
      items: [ true, true ]
    })

    assert.isTrue(res)
  })

  it('logicAnd simple. false', async () => {
    const scope = newScope()
    const res = await scope.$run({
      $exp: 'logicAnd',
      items: [ true, false ]
    })

    assert.isFalse(res)
  })

  it('logicAnd. Mixed. true', async () => {
    const scope = newScope({v1: true})
    const res = await scope.$run({
      $exp: 'logicAnd',
      items: [
        {
          $exp: 'getValue',
          path: 'v1',
        },
        true
      ]
    })

    assert.isTrue(res)
  })

  it('logicAnd. Mixed. false', async () => {
    const scope = newScope({v1: true})
    const res = await scope.$run({
      $exp: 'logicAnd',
      items: [
        {
          $exp: 'getValue',
          path: 'v1',
        },
        false
      ]
    })

    assert.isFalse(res)
  })

  it('logicAnd. super value. true', async () => {
    const scope = newScope({v1: true, v2: true})
    const res = await scope.$run({
      $exp: 'logicAnd',
      items: [
        {
          $exp: 'getValue',
          path: 'v1',
        },
        {
          $exp: 'getValue',
          path: 'v2',
        },
      ]
    })

    assert.isTrue(res)
  })

  it('logicAnd. super value. false', async () => {
    const scope = newScope({v1: true, v2: false})
    const res = await scope.$run({
      $exp: 'logicAnd',
      items: [
        {
          $exp: 'getValue',
          path: 'v1',
        },
        {
          $exp: 'getValue',
          path: 'v2',
        },
      ]
    })

    assert.isFalse(res)
  })

})
