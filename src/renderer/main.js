import Vue from 'vue';
import axios from 'axios';
import vmodal from 'vue-js-modal';

import App from './App';
import router from './router';
import store from './store';
import Qs from 'qs';


const bodyParser = require('body-parser');
const express = require('express');
const expressApp = express();

expressApp.use(bodyParser.urlencoded({ extended: true }));
expressApp.use(bodyParser.json());



//刷新token的请求方法
function getRefreshToken() {
  return axios.post(`${store.state.Information.baseUrl}/oauth/token`,Qs.stringify({
    grant_type:'refresh_token',
    client_id:'mn-installer',
    client_secret:'mn-installer',
    refresh_token: store.state.User.refreshToken,
  }))
    .then(res => {
      return Promise.resolve(res);
    });
}

//  在拦截器中添加tokenid
axios.interceptors.request.use(
  config => {
      let url = String(config.url);
      if(url.indexOf("paas.vpubchain.org") != -1){
        //访问的是运营后台，则判断token是否需要刷新
        if(store.state.User.loginTime){
          let loginTime = new Date(store.state.User.loginTime);
          let nowTime = new Date();
          if(nowTime.getTime()-loginTime.getTime()>7200000 && !window.isRetryRequest && store.state.Steps!=2){
            window.isRetryRequest = true;
            return getRefreshToken()
              .then(res => {
                window.isRetryRequest = false;
                let accessToken = res.data.access_token;
                let refreshToken = res.data.refresh_token;
                store.commit('SET_USERTOKEN', {
                  accessToken: accessToken,
                });
                store.commit('SET_REFTOKEN', {
                  refreshToken: refreshToken,
                });
                let loginTime = new Date();
                store.commit('SET_LOGINTIME', {
                  loginTime: loginTime,
                });
                config.headers.Authorization = `Bearer ` + accessToken;
                return config;
              })
          }
        }
      }
      return config
  },
  error => {
    return Promise.reject(error)
});

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
