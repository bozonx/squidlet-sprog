import {newScope, SuperData} from "../../src/index.js";
import {SUPER_VALUE_EVENTS} from "../../src/lib/SuperValueBase.js";


describe('SuperData super children', () => {

  it('children is SuperData', async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const rootDef = {
      ch: {
        type: 'SuperData'
      }
    }
    const rootProxy = (new SuperData(rootDef)).getProxy()
    const childProxy = (new SuperData()).getProxy()

    rootProxy.subscribe((target, path) => spy1(path))
    childProxy.subscribe((target, path) => spy2(path))
    childProxy.$super.init({a: 1})
    rootProxy.$super.init({ch: childProxy})

    assert.equal(rootProxy.getValue('ch.a'), 1)
    spy1.should.have.been.calledOnce
    spy2.should.have.been.calledOnce
    // set value to child
    rootProxy.setValue('ch.a', 2)
    assert.equal(rootProxy.getValue('ch.a'), 2)
    assert.equal(childProxy.getValue('a'), 2)
    spy1.should.have.been.calledTwice
    spy2.should.have.been.calledTwice
    spy1.should.have.been.calledWith(undefined)
    spy2.should.have.been.calledWith(undefined)
    spy1.should.have.been.calledWith('ch.a')
    spy2.should.have.been.calledWith('ch.a')
  })

  it('children is SuperData - no definition', async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const rootProxy = (new SuperData()).getProxy()
    const childProxy = (new SuperData()).getProxy()

    rootProxy.subscribe((target, path) => spy1(path))
    childProxy.subscribe((target, path) => spy2(path))
    childProxy.$super.init({a: 1})
    rootProxy.$super.init({ch: childProxy})

    assert.equal(rootProxy.getValue('ch.a'), 1)
    spy1.should.have.been.calledOnce
    spy2.should.have.been.calledOnce
    // set value to child
    rootProxy.setValue('ch.a', 2)
    assert.equal(rootProxy.getValue('ch.a'), 2)
    assert.equal(childProxy.getValue('a'), 2)
    spy1.should.have.been.calledTwice
    spy2.should.have.been.calledTwice
  })

  it('super children destroy', async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const rootProxy = (new SuperData()).getProxy()
    const childProxy = (new SuperData()).getProxy()

    rootProxy.$super.events.addListener(SUPER_VALUE_EVENTS.destroy, spy1)
    childProxy.$super.events.addListener(SUPER_VALUE_EVENTS.destroy, spy2)
    childProxy.$super.init({a: 1})
    rootProxy.$super.init({ch: childProxy})

    rootProxy.$super.destroy()

    assert.isTrue(rootProxy.$super.isDestroyed)
    assert.isTrue(childProxy.$super.isDestroyed)
    spy1.should.have.been.calledOnce
    spy2.should.have.been.calledOnce
  })

})
