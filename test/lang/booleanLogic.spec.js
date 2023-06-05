import {newScope} from "../../src/index.js";
import {isLess, isLessOrEqual, logicAnd} from "../../src/lang/booleanLogic.js";


describe('booleanLogic', () => {
  ///////// AND
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

  ///////// OR
  it('logicOr. Mixed. true', async () => {
    const scope = newScope({v1: true})
    const res = await scope.$run({
      $exp: 'logicOr',
      items: [
        {
          $exp: 'getValue',
          path: 'v1',
        },
        false
      ]
    })

    assert.isTrue(res)
  })

  it('logicOr. Mixed. false', async () => {
    const scope = newScope({v1: false})
    const res = await scope.$run({
      $exp: 'logicOr',
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

  it('logicOr. Mixed. both false', async () => {
    const scope = newScope({v1: false, v2: false})
    const res = await scope.$run({
      $exp: 'logicOr',
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

  ///////// NOT
  it('logicNot. positive', async () => {
    const scope = newScope({v1: true})
    const res = await scope.$run({
      $exp: 'logicNot',
      value: {
        $exp: 'getValue',
        path: 'v1',
      }
    })

    assert.isFalse(res)
  })

  it('logicNot. negative', async () => {
    const scope = newScope({v1: false})
    const res = await scope.$run({
      $exp: 'logicNot',
      value: {
        $exp: 'getValue',
        path: 'v1',
      }
    })

    assert.isTrue(res)
  })

  it('logicNot. simple', async () => {
    const scope = newScope({v1: false})
    const res = await scope.$run({
      $exp: 'logicNot',
      value: 5
    })

    assert.isFalse(res)
  })

  it('logicNot. simple negative', async () => {
    const scope = newScope({v1: false})
    const res = await scope.$run({
      $exp: 'logicNot',
      value: ''
    })

    assert.isTrue(res)
  })

  ///////// EQUAL

  it('isEqual. true', async () => {
    const scope = newScope({v1: 4})
    const res = await scope.$run({
      $exp: 'isEqual',
      items: [
        {
          $exp: 'getValue',
          path: 'v1',
        },
        4
      ]
    })

    assert.isTrue(res)
  })

  it('isEqual. false', async () => {
    const scope = newScope({v1: 4})
    const res = await scope.$run({
      $exp: 'isEqual',
      items: [
        {
          $exp: 'getValue',
          path: 'v1',
        },
        5
      ]
    })

    assert.isFalse(res)
  })

  it('isEqual. bot super. true', async () => {
    const scope = newScope({v1: 4, v2: 4})
    const res = await scope.$run({
      $exp: 'isEqual',
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

  it('isEqual. bot super. true', async () => {
    const scope = newScope({v1: 4, v2: 0})
    const res = await scope.$run({
      $exp: 'isEqual',
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

  ///////// IS GREATER

  it('isGreater. simple. true', async () => {
    const scope = newScope()
    const res = await scope.$run({
      $exp: 'isGreater',
      items: [ 2, 1 ]
    })

    assert.isTrue(res)
  })

  it('isGreater. simple. false', async () => {
    const scope = newScope()
    const res = await scope.$run({
      $exp: 'isGreater',
      items: [ 1, 1 ]
    })

    assert.isFalse(res)
  })

  it('isGreater. super. true', async () => {
    const scope = newScope({v1: 2, v2: 1})
    const res = await scope.$run({
      $exp: 'isGreater',
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

  it('isGreater. super. false', async () => {
    const scope = newScope({v1: 2, v2: 5})
    const res = await scope.$run({
      $exp: 'isGreater',
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

  ///////// IS LESS

  it('isLess. super. true', async () => {
    const scope = newScope({v1: 1, v2: 2})
    const res = await scope.$run({
      $exp: 'isLess',
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

  it('isLess. super. false', async () => {
    const scope = newScope({v1: 2, v2: 2})
    const res = await scope.$run({
      $exp: 'isLess',
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

  ///////// IS GREATER OR EQUAL

  it('isGreaterOrEqual. super. equal', async () => {
    const scope = newScope({v1: 1, v2: 1})
    const res = await scope.$run({
      $exp: 'isGreaterOrEqual',
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

  it('isGreaterOrEqual. super. greater', async () => {
    const scope = newScope({v1: 2, v2: 1})
    const res = await scope.$run({
      $exp: 'isGreaterOrEqual',
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

  it('isGreaterOrEqual. super. false', async () => {
    const scope = newScope({v1: 2, v2: 5})
    const res = await scope.$run({
      $exp: 'isGreaterOrEqual',
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

  //////// IS LESS OR EQUAL
  it('isLessOrEqual. super. equal', async () => {
    const scope = newScope({v1: 1, v2: 1})
    const res = await scope.$run({
      $exp: 'isLessOrEqual',
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

  it('isLessOrEqual. super. less', async () => {
    const scope = newScope({v1: 0, v2: 1})
    const res = await scope.$run({
      $exp: 'isLessOrEqual',
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

  it('isLessOrEqual. super. false', async () => {
    const scope = newScope({v1: 2, v2: 0})
    const res = await scope.$run({
      $exp: 'isLessOrEqual',
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
