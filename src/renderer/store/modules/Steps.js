const state = {
  currentStep: 0,
  isEnvPrepared:false,
  isInstalling:false,
};

const mutations = {
  SET_STEP(state, payload) {
    state.currentStep = payload.currentStep;
  },
  SET_ENVPRE(state, payload){
    state.isEnvPrepared = payload.isEnvPrepared;
  },
  SET_INSTALL_STATUS(state, payload){
    state.isInstalling = payload.isInstalling;
  }
};

export default {
  state,
  mutations,
};
