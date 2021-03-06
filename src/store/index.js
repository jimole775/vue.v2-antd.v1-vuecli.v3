import Vue from 'vue'
import Vuex from 'vuex'
import global from './global'
import builder from './builder'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    global,
    builder
  }
})
