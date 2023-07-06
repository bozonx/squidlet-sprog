import {newScope, SuperData} from "../../src/index.js";


describe('SuperData execute', () => {
  it('execute expressions - deep array', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const def = {
      $exp: 'newSuperData',
      definition: {
        p1: {
          type: 'array',
        },
      },
    }
    const data = await scope.$run(def)

    data.subscribe(spy)
    data.$super.init()

    await data.$super.execute(newScope({scopeVal: 2}), {
      p1: [
        [
          {
            $exp: 'getValue',
            path: 'scopeVal',
          }
        ]
      ]
    })

    assert.deepEqual(data.getValue('p1'), [[2]])
    spy.should.have.been.calledTwice
  })

  it('execute expressions - deep obj - no definition', async () => {
    const scope = newScope()
    const spy = sinon.spy()
    const data = await scope.$run({
      $exp: 'newSuperData'
    })

    data.subscribe(spy)
    data.$super.init()

    await data.$super.execute(newScope({scopeVal: {a: 2}}), {
      p1: [
        {
          $exp: 'getValue',
          path: 'scopeVal',
        }
      ]
    })

    assert.deepEqual(data.getValue('p1'), [{a: 2}])
    spy.should.have.been.calledTwice
  })

  it('execute expressions - layers, the same key', async () => {
    const spyBottom = sinon.spy()
    const spyTop = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spyBottom)
    dataBottom.init({a: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spyTop)
    dataTop.init()

    await dataTop.execute(newScope({scopeVal: 2}), {
      a: {
        $exp: 'getValue',
        path: 'scopeVal',
      }
    })

    assert.equal(dataBottom.getValue('a'), 1)
    assert.equal(dataTop.getValue('a'), 2)
    spyBottom.should.have.been.calledOnce
    spyTop.should.have.been.calledTwice
  })

  it('execute expressions - layers, new key', async () => {
    const spyBottom = sinon.spy()
    const spyTop = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spyBottom)
    dataBottom.init({a: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spyTop)
    dataTop.init()

    await dataTop.execute(newScope({scopeVal: 2}), {
      b: {
        $exp: 'getValue',
        path: 'scopeVal',
      }
    })

    assert.equal(dataBottom.getValue('a'), 1)
    assert.isUndefined(dataBottom.getValue('b'))
    assert.equal(dataTop.getValue('a'), 1)
    assert.equal(dataTop.getValue('b'), 2)
    spyBottom.should.have.been.calledOnce
    spyTop.should.have.been.calledTwice
  })

  it(`execute expressions - layers, bottom has key which top doesn't have`, async () => {
    const spyBottom = sinon.spy()
    const spyTop = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spyBottom)
    dataBottom.init({b: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spyTop)
    dataTop.init({a: 1})

    await dataTop.execute(newScope({scopeVal: 2}), {
      a: {
        $exp: 'getValue',
        path: 'scopeVal',
      }
    })

    assert.isUndefined(dataBottom.getValue('a'))
    assert.equal(dataBottom.getValue('b'), 1)
    assert.equal(dataTop.getValue('a'), 2)
    assert.equal(dataTop.getValue('b'), 1)
    spyBottom.should.have.been.calledOnce
    spyTop.should.have.been.calledTwice
  })

  it(`execute expressions - new top value`, async () => {
    const spyBottom = sinon.spy()
    const spyTop = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spyBottom)
    dataBottom.init({b: 1})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spyTop)
    dataTop.init()

    await dataTop.execute(newScope({scopeVal: 2}), {
      a: {
        $exp: 'getValue',
        path: 'scopeVal',
      }
    })

    assert.isUndefined(dataBottom.getValue('a'))
    assert.equal(dataBottom.getValue('b'), 1)
    assert.equal(dataTop.getValue('a'), 2)
    assert.equal(dataTop.getValue('b'), 1)
    spyBottom.should.have.been.calledOnce
    spyTop.should.have.been.calledTwice
  })

  it(`execute expressions - deep layers`, async () => {
    const spyBottom = sinon.spy()
    const spyTop = sinon.spy()
    const dataBottom = new SuperData()

    dataBottom.subscribe(spyBottom)
    dataBottom.init({a: {aa: 1, bb: 1}})

    const dataTop = new SuperData(
      undefined,
      undefined,
      dataBottom
    )

    dataTop.subscribe(spyTop)
    dataTop.init()

    await dataTop.execute(newScope({scopeVal: 2}), {
      a: {
        aa: {
          $exp: 'getValue',
          path: 'scopeVal',
        }
      }
    })

    assert.deepEqual(dataBottom.getValue('a'), {aa: 1, bb: 1})
    assert.deepEqual(dataTop.getValue('a'), {aa: 2, bb: 1})
    spyBottom.should.have.been.calledOnce
    spyTop.should.have.been.calledTwice
  })

})
