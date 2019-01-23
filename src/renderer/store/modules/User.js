const state = {
  accessToken: null,
};

const mutations = {
  SET_USERTOKEN(state, payload) {
    state.accessToken = payload.accessToken;
  },
};

export default {
  state,
  mutations,
};
