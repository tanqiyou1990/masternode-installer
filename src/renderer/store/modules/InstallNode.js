const state = {
  nodeData: null,
  count:null
};

const mutations = {
  SET_NODEDATA(state, payload) {
    state.nodeData = payload.nodeData;
  },
  SET_NODEDCOUNT(state, payload) {
    state.count = payload.count;
  }
};

export default {
  state,
  mutations,
};
