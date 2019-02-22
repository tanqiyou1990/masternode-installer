const state = {
  genkey: null,
  output: null,
  ip: null,
  mnName: null,
  mnCodeName:null,
  mnId:null,
  mnConfPath: null,
  mnAccount:null,
  baseUrl:'https://paas.vpubchain.org'
};

const mutations = {
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
  SET_MNCODENAME(state, payload){
    state.mnCodeName = payload.mnCodeName;
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
