import {newScope} from "../../src/index.js";
import {newVar} from "../../src/lang/simpleVar.js";


describe('simpleVar', () => {
  it('newVar', async () => {
    const scope = newScope()
    const def = {
      $exp: 'newVar',
      name: 'v1',
      definition: {
        type: 'number',
        default: 5,
        required: false,
        readonly: false,
        nullable: false,
      }
    }

    await scope.$run(def)
  })
})
