import Vue from 'vue';
import axios from 'axios';
import vmodal from 'vue-js-modal';

import App from './App';
import router from './router';
import store from './store';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

const config = {
    apiKey: "AIzaSyCl0ArDJ4pq2dHZLG3vhik6MBW7cLCZpDQ",
    authDomain: "vpub-masternode.firebaseapp.com",
    databaseURL: "https://vpub-masternode.firebaseio.com",
    projectId: "vpub-masternode",
    storageBucket: "vpub-masternode.appspot.com",
    messagingSenderId: "392338398280"
};
window.firebase.initializeApp(config);

Vue.use(vmodal, { dialog: true });

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>',
}).$mount('#app');
