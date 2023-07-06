import {newScope, SuperData} from "../../src/index.js";
import {SUPER_VALUE_EVENTS} from "../../src/lib/SuperValueBase.js";


describe('SuperData simple deep children', () => {
  it('manipulate deep object without definition', async () => {
    const spy = sinon.spy()
    const sdata = (new SuperData()).getProxy()

    sdata.subscribe((target, path) => spy(path))
    sdata.$super.init({a: {b: 1}})

    assert.equal(sdata.getValue('a.b'), 1)
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(undefined)
    // set value
    sdata.setValue('a.b', 2)
    assert.equal(sdata.getValue('a.b'), 2)
    spy.should.have.been.calledTwice
    spy.should.have.been.calledWith('a.b')
  })

  it('manipulate deep object with definition', async () => {
    const spy = sinon.spy()
    const sdata = (new SuperData({
      a: {
        type: 'object',
        default: {
          b: 1
        }
      }
    })).getProxy()

    sdata.subscribe((target, path) => spy(path))
    sdata.$super.init()

    assert.equal(sdata.getValue('a.b'), 1)
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(undefined)
    // set value
    sdata.setValue('a.b', 2)
    assert.equal(sdata.getValue('a.b'), 2)
    spy.should.have.been.calledTwice
    spy.should.have.been.calledWith('a.b')
  })

  it('manipulate deep array without definition', async () => {
    const spy = sinon.spy()
    const sdata = (new SuperData()).getProxy()

    sdata.subscribe((target, path) => spy(path))
    sdata.$super.init({a: ['b']})

    assert.equal(sdata.getValue('a[0]'), 'b')
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(undefined)
    // set value
    sdata.setValue('a[0]', 'q')
    assert.equal(sdata.getValue('a[0]'), 'q')
    spy.should.have.been.calledTwice
    spy.should.have.been.calledWith('a[0]')
  })

})
