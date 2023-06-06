import {newScope} from "../../src/index.js";


describe('forEach', () => {
  it('common check simple array', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: ['a', 'b', 'c'],
      do: [
        {
          $exp: 'simpleCall',
          path: 'spy',
          args: [
            {
              $exp: 'getValue',
              path: 'value',
            },
            {
              $exp: 'getValue',
              path: 'key',
            },
            {
              $exp: 'getValue',
              path: 'i',
            },
            {
              $exp: 'getValue',
              path: '$isFirst',
            },
            {
              $exp: 'getValue',
              path: '$isLast',
            },
          ]
        }
      ]
    })

    spy.should.have.been.calledThrice
    spy.should.have.been.calledWith('a', 0, 0, true, false)
    spy.should.have.been.calledWith('b', 1, 1, false, false)
    spy.should.have.been.calledWith('c', 2, 2, false, true)
  })

  it('common check simple object', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: {a1: 1, a2: 2, a3: 3},
      do: [
        {
          $exp: 'simpleCall',
          path: 'spy',
          args: [
            {
              $exp: 'getValue',
              path: 'value',
            },
            {
              $exp: 'getValue',
              path: 'key',
            },
            {
              $exp: 'getValue',
              path: 'i',
            },
            {
              $exp: 'getValue',
              path: '$isFirst',
            },
            {
              $exp: 'getValue',
              path: '$isLast',
            },
          ]
        }
      ]
    })

    spy.should.have.been.calledThrice
    spy.should.have.been.calledWith(1, 'a1', 0, true, false)
    spy.should.have.been.calledWith(2, 'a2', 1, false, false)
    spy.should.have.been.calledWith(3, 'a3', 2, false, true)
  })

  it('reverse simple array', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      reverse: true,
      src: ['a', 'b', 'c'],
      do: [
        {
          $exp: 'simpleCall',
          path: 'spy',
          args: [
            {
              $exp: 'getValue',
              path: 'value',
            },
            {
              $exp: 'getValue',
              path: 'key',
            },
            {
              $exp: 'getValue',
              path: 'i',
            },
            {
              $exp: 'getValue',
              path: '$isFirst',
            },
            {
              $exp: 'getValue',
              path: '$isLast',
            },
          ]
        }
      ]
    })

    spy.should.have.been.calledThrice
    spy.should.have.been.calledWith('c', 2, 2, true, false)
    spy.should.have.been.calledWith('b', 1, 1, false, false)
    spy.should.have.been.calledWith('a', 0, 0, false, true)
  })

  it('reverse simple object', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      reverse: true,
      src: {a1: 1, a2: 2, a3: 3},
      do: [
        {
          $exp: 'simpleCall',
          path: 'spy',
          args: [
            {
              $exp: 'getValue',
              path: 'value',
            },
            {
              $exp: 'getValue',
              path: 'key',
            },
            {
              $exp: 'getValue',
              path: 'i',
            },
            {
              $exp: 'getValue',
              path: '$isFirst',
            },
            {
              $exp: 'getValue',
              path: '$isLast',
            },
          ]
        }
      ]
    })

    spy.should.have.been.calledThrice
    spy.should.have.been.calledWith(3, 'a3', 2, true, false)
    spy.should.have.been.calledWith(2, 'a2', 1, false, false)
    spy.should.have.been.calledWith(1, 'a1', 0, false, true)
  })

  it('get array from scope', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy, arr: ['a']})

    await scope.$run({
      $exp: 'forEach',
      src: {
        '$exp': 'getValue',
        path: 'arr'
      },
      do: [
        {
          $exp: 'simpleCall',
          path: 'spy',
          args: [
            {
              $exp: 'getValue',
              path: 'value',
            },
          ]
        }
      ]
    })

    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith('a')
  })

  // TODO: test continue
  // TODO: test break
  // TODO: test return
  // TODO: test break, continue inside forEach and ifElse

})
