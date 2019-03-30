const state = {
  nodeData: null
};

const mutations = {
  SET_NODEDATA(state, payload) {
    state.nodeData = payload.nodeData;
  }
};

export default {
  state,
  mutations,
};
