// main file for tests
import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import rewire from 'rewire'
//import * as lodash from 'lodash'

chai.use(chaiAsPromised)
chai.use(sinonChai)

chai.should()

global.assert = chai.assert
//global.expect = chai.expect
global.sinon = sinon
global.rewire = rewire

//global._ = lodash

// do not log to console
//global.silent = true
