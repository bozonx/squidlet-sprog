import {newScope} from "../../src/index.js";
import {logicAnd} from "../../src/lang/booleanLogic.js";


describe('booleanLogic', () => {
  it.only('logicAnd simple. true', async () => {
    const scope = newScope()
    const res = await scope.$run({
      $exp: 'logicAnd',
      items: [
        1,
        2
      ]
    })

    assert.isTrue(res)
  })

  it.only('logicAnd simple. false', async () => {
    const scope = newScope()
    const res = await scope.$run({
      $exp: 'logicAnd',
      items: [
        1,
        2
      ]
    })

    assert.isTrue(res)
  })

  it.only('logicAnd. Mixed. true', async () => {
    const scope = newScope({v1: 1})
    const res = await scope.$run({
      $exp: 'logicAnd',
      items: [
        {
          $exp: 'getValue',
          path: 'v1',
        },
        1
      ]
    })

    assert.isTrue(res)
  })

  it.only('logicAnd. Mixed. false', async () => {
    const scope = newScope({v1: 1, v2: 1})
    const res = await scope.$run({
      $exp: 'logicAnd',
      items: [
        {
          $exp: 'getValue',
          path: 'v1',
        },
        0
      ]
    })

    assert.isTrue(res)
  })

  it.only('logicAnd. super value. true', async () => {
    const scope = newScope({v1: 1, v2: 1})
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

  it.only('logicAnd. super value. false', async () => {
    const scope = newScope({v1: 1, v2: 0})
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

})
