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

  it('continue. array', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: ['a', 'b', 'c'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'b'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'continueCycle',
                },
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
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledTwice
    spy.should.have.been.calledWith('a')
    spy.should.have.been.calledWith('c')
  })

  it('continue. object', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: {a: 1, b: 2, c: 3},
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'key',
                    },
                    'b'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'continueCycle',
                },
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
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledTwice
    spy.should.have.been.calledWith(1)
    spy.should.have.been.calledWith(3)
  })

  it('break. array', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: ['a', 'b', 'c'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'b'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'breakCycle',
                },
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
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith('a')
  })

  it('break. object', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: {a: 1, b: 2, c: 3},
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'key',
                    },
                    'b'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'breakCycle',
                },
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
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(1)
  })

  it('return. array', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    const res = await scope.$run({
      $exp: 'forEach',
      src: ['a', 'b', 'c'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'b'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'superReturn',
                  value: 5
                },
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
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith('a')
    assert.equal(res, 5)
  })

  it('empty return. array', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    const res = await scope.$run({
      $exp: 'forEach',
      src: ['a', 'b', 'c'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'b'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'superReturn',
                },
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
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith('a')
  })

  it('return. object', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    const res = await scope.$run({
      $exp: 'forEach',
      src: {a:1, b:2, c:3},
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'key',
                    },
                    'b'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'superReturn',
                  value: 5
                },
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
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(1)
    assert.equal(res, 5)
  })

  it('inner cycle', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    const res = await scope.$run({
      $exp: 'forEach',
      src: [{aa: 1}],
      do: [
        {
          $exp: 'forEach',
          src: {
            $exp: 'getValue',
            path: 'value'
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
        }
      ]
    })

    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(1)
  })

  /////////// STEPS

  /////// $skipNext

  it('$skipNext(). array', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: ['a', 'b', 'c'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'a'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$skipNext'
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith('c')
  })

  it('$skipNext(). to high step', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: ['a', 'b'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'a'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$skipNext'
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.not.been.called
  })

  it('$skipNext(). reverse. array', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      reverse: true,
      src: ['a', 'b', 'c'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'c'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$skipNext'
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith('a')
  })

  it('$skipNext(). reverse. array. to high step', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      reverse: true,
      src: ['b', 'c'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'c'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$skipNext'
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.not.been.called
  })

  it('$skipNext(). object', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: {a: 1, b: 2, c: 3},
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'key',
                    },
                    'a'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$skipNext'
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(3)
  })

  //////////////// $skip

  it('$skip(steps). array', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: ['a', 'b', 'c', 'd'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'a'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$skip',
                  args: [ 2 ]
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith('d')
  })

  it('$skip(steps). array. to high step', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: ['a', 'b', 'c', 'd'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'a'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$skip',
                  args: [ 3 ]
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.not.been.called
  })

  it('$skip(steps). array. reverse', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      reverse: true,
      src: ['a', 'b', 'c', 'd'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'd'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$skip',
                  args: [ 2 ]
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith('a')
  })

  it('$skip(steps). array. reverse. to high step', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      reverse: true,
      src: ['a', 'b', 'c', 'd'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'd'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$skip',
                  args: [ 3 ]
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.not.been.called
  })

  it('$skip(steps). object', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: {a: 1, b: 2, c: 3, d: 4},
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'key',
                    },
                    'a'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$skip',
                  args: [ 2 ]
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledOnce
    spy.should.have.been.calledWith(4)
  })

  //////// $toStep(stepNumber)

  it('$toStep(stepNumber). array', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: ['a', 'b', 'c', 'd'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'a'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$toStep',
                  args: [ 2 ]
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledTwice
    spy.should.have.been.calledWith('c')
    spy.should.have.been.calledWith('d')
  })

  it('$toStep(stepNumber). array. to high step', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: ['a', 'b', 'c', 'd'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'a'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$toStep',
                  args: [ 4 ]
                }
              ]
            },
            // else
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.not.been.called
  })

  it('$toStep(stepNumber). reverse. array', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      reverse: true,
      src: ['a', 'b', 'c', 'd'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'd'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$toStep',
                  args: [ 1 ]
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledTwice
    spy.should.have.been.calledWith('b')
    spy.should.have.been.calledWith('a')
  })

  it('$toStep(stepNumber). reverse. array. -1', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      reverse: true,
      src: ['a', 'b', 'c', 'd'],
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'value',
                    },
                    'd'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$toStep',
                  args: [ -1 ]
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.not.been.called
  })

  it('$toStep(stepNumber). object', async () => {
    const spy = sinon.spy()
    const scope = newScope({spy})

    await scope.$run({
      $exp: 'forEach',
      src: {a: 1, b: 2, c: 3, d: 4},
      do: [
        {
          $exp: 'ifElse',
          items: [
            {
              condition: [
                {
                  $exp: 'isEqual',
                  items: [
                    {
                      $exp: 'getValue',
                      path: 'key',
                    },
                    'a'
                  ]
                }
              ],
              lines: [
                {
                  $exp: 'simpleCall',
                  path: '$toStep',
                  args: [ 2 ]
                }
              ]
            },
            {
              lines: [
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
            }
          ]
        }
      ]
    })

    spy.should.have.been.calledTwice
    spy.should.have.been.calledWith(3)
    spy.should.have.been.calledWith(4)
  })

})
