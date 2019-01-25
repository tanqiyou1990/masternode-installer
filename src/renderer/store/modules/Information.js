const state = {
  accessToken: '6aedd996017e545fbc206a01560de55bac9b47c0ac6c135f732c0d78fee8a732',
  genkey: null,
  output: null,
  ip: null,
  mnName: null,
  mnId:null,
  mnConfPath: null,
  mnAccount:null,
  baseUrl:'http://localhost:4001'
};

const mutations = {
  SET_ACCESS_TOKEN(state, payload) {
    state.accessToken = payload.accessToken;
  },
  SET_GENKEY(state, payload) {
    state.genkey = payload.genkey;
  },
  SET_OUTPUT(state, payload) {
    state.output = payload.output;
  },
  SET_IP(state, payload) {
    state.ip = payload.ip;
  },
  SET_MNNAME(state, payload) {
    state.mnName = payload.mnName;
  },
  SET_MNID(state, payload) {
    state.mnId = payload.mnId;
  },
  SET_MNCONFPATH(state, payload) {
    state.mnConfPath = payload.mnConfPath;
  },
  SET_MNACCOUNT(state, payload){
    state.mnAccount = payload.mnAccount
  }
};

export default {
  state,
  mutations,
};
