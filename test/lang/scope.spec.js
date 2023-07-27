import {omitObj} from "squidlet-lib";
import {newScope} from "../../src/index.js";
import {stdLib} from "../../src/stdLib.js";


describe('scope', () => {
  it('inherit scope with definitions', async () => {
    const scope1 = newScope({v0: 0})
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()

    await scope1.$run({
      $exp: 'newVar',
      name: 'v1',
      definition: {
        type: 'number',
        default: 1,
      }
    })

    const scope2 = newScope({v3: 3}, scope1)

    await scope2.$run({
      $exp: 'newVar',
      name: 'v2',
      value: 2,
    })

    assert.deepEqual(omitObj(scope2.$super.clone(), 'std'), {v0: 0, v1: 1, v2: 2, v3: 3})
    assert.deepEqual(scope2.$super.getDefinition('v1').type, 'number')
    // catch changes from scope2
    scope1.$super.subscribe(spy1)
    scope2.$super.subscribe(spy2)
    scope2.$super.setOwnValue('v1', 8)
    spy1.should.have.not.been.called
    spy2.should.have.been.calledOnce
  })

  it('layers', async () => {
    const scope1 = newScope({v0: 0})
    const scope2 = newScope(undefined, scope1)

    await scope2.$run({
      $exp: 'newVar',
      name: 'v0',
      value: 1,
    })

    assert.deepEqual(omitObj(scope1.$super.clone(), 'std'), {v0: 0})
    assert.deepEqual(omitObj(scope2.$super.clone(), 'std'), {v0: 1})
  })

  it('std', async () => {
    const scope = newScope({})

    const res = await scope.$run({
      $exp: 'superReturn',
      value: {
        $exp: 'simpleCall',
        path: 'std.deduplicate',
        args: [
          [0,0,1]
        ]
      },
    })

    assert.deepEqual(res, [0,1])
  })

  it('forbid to delete variables', async () => {
    const scope = newScope({})

    await scope.$run({
      $exp: 'newVar',
      name: 'a',
      value: 1
    })

    assert.throws(() => delete scope['a'])

    // actually it is possible to delete via scope.$super.forget()
  })

  it('clone', async () => {
    const scopeBottom = newScope({a: 0, b: 0})
    const scopeTop = newScope({}, scopeBottom)

    await scopeTop.$run({
      $exp: 'newVar',
      name: 'a',
      value: 1
    })

    assert.deepEqual(scopeBottom.$cloneSelf(), {a: 0, b: 0, std: stdLib})
    assert.deepEqual(scopeTop.$cloneSelf(), {a: 1, b: 0, std: stdLib})
  })

  it('get whole scope', async () => {
    const scopeBottom = newScope({a: 0, b: 0})
    const scopeTop = newScope({}, scopeBottom)

    await scopeTop.$run({
      $exp: 'newVar',
      name: 'a',
      value: 1
    })

    assert.deepEqual(scopeBottom, {a: 0, b: 0, std: stdLib})
    assert.equal(scopeTop.b, 0)
    assert.deepEqual(scopeTop, {a: 1, b: 0, std: stdLib})
  })

  it.only('$runAll', async () => {
    const scopeBottom = newScope({a: 0, b: 1})
    const scopeTop = newScope({}, scopeBottom)

    const res = await scopeTop.$calculate({
      a: {
        $exp: 'getValue',
        path: 'b',
      },
      c: 1
    })

    console.log(111, res)

    assert.deepEqual(scopeBottom, {a: 0, std: stdLib})
    assert.deepEqual(scopeTop, {a: 1, b: 1, std: stdLib})
  })

})
