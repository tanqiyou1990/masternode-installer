import Vue from 'vue';
import axios from 'axios';
import vmodal from 'vue-js-modal';

import App from './App';
import router from './router';
import store from './store';


const bodyParser = require('body-parser');
const express = require('express');
const expressApp = express();

expressApp.use(bodyParser.urlencoded({ extended: true }));
expressApp.use(bodyParser.json());

expressApp.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  if (req.method === 'OPTIONS') {
    res.send(200)
  } else {
    next()
  }
});


if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;
Vue.use(vmodal, { dialog: true });

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>',
}).$mount('#app');

expressApp.get("/check-env",(req,res) => {
  if(store.state.Steps.isInstalling){
    res.send(1);
  }else{
    if(store.state.Steps.isEnvPrepared){
      res.send(true);
    }else{
      res.send(2);
    }
  }
});

expressApp.post("/mnInstall",(req,res) => {
  let mid = req.body.mid;
  let userToken = req.body.token;
  console.log(req.body);
  if(mid&&userToken){
    store.commit('SET_INSTALL_STATUS', {
      isInstalling: true,
    });
    store.commit('SET_USERTOKEN', {
      accessToken: userToken,
    });
    store.commit('SET_MNID', {
      mnId: mid,
    });
    store.commit('SET_STEP', {
      currentStep: 1,
    });
    res.send(true);
  }else{
    res.send(false);
  }
});



expressApp.listen(3456,() => {
  console.log('Server listening on port 3456!');
});
