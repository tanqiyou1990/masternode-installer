const state = {
  accessToken: null,
  refreshToken:null,
  loginTime:null
};

const mutations = {
  SET_USERTOKEN(state, payload) {
    state.accessToken = payload.accessToken;
  },
  SET_LOGINTIME(state, payload) {
    state.loginTime = payload.loginTime;
  }, 
  SET_REFTOKEN(state, payload) {
    state.refreshToken = payload.refreshToken;
  }
};

export default {
  state,
  mutations,
};
