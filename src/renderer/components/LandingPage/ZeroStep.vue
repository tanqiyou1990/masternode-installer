<template>
  <div>

    <div v-if="!isLogin" id="second-step" class = "login">
      <h1>LOGIN</h1>
      <input type="text" v-model="userName" name="u" placeholder="用户名" required="required" />
      <input type="password" v-model="passWd" name="p" placeholder="密码" required="required" />
      <button @click="userLogin" class="btn btn-primary btn-block btn-large">登录</button>
    </div>

    <div v-if="isLogin" id="second-step">
      <h1>数据同步中...</h1>
      <div class="loading">
        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { setTimeout } from 'timers';
const remote = require('electron').remote;
const Client = require('@vpubevo/vpub-core');
const client = new Client({
  username: 'mn',
  password: '999000',
  port: 9902,
});

export default {
  data() {
    return {
      blockCount: 0,
      isLogin:false,
      userName:'',
      passWd:''
    };
  },
  methods: {
    userLogin(){
      if(this.userName==''||this.passWd==''){
        new window.Notification('提示', {
          body: '用户名或者密码不能为空。',
        });
        return;
      }

      axios.post('https://paas.vpubchain.org/user/login',{
        userName:this.userName,
        passWd:this.passWd
      })
      .then((response) => {
        console.log("登录成功");
        this.$store.commit('SET_USERTOKEN', {
          accessToken: "123456789",
        });      
        console.log("用户TOKEN:"+this.$store.state.User.accessToken);
        this.isLogin=true;
        this.checkIfWalletIsAlreadyRunning();
      }).catch((err) => {
        new window.Notification('登录遇到异常', {
          body: err,
        });
        return;
      });
      
    },
    getBlockCount() {
      axios.get('https://pl.vpubchain.net/api/getblockcount')
        .then((response) => {
          this.blockCount = Number(response.data);
        }).catch((err) => {
          console.log("获取区块高度失败，5s重新获取");
          setTimeout(() => {
            this.getBlockCount();
          }, 5000);          
        });
    },
    checkIfWalletIsLoaded() {
      client
        .getBlockCount()
        .then((response) => {
          if (response >= this.blockCount) {
            console.log('synced');
            this.$store.commit('SET_STEP', {
              currentStep: 1,
            });
          } else {
            setTimeout(() => {
              this.checkIfWalletIsLoaded();
            }, 3000);
          }
        })
        .catch(() => {
          setTimeout(() => {
            this.checkIfWalletIsLoaded();
          }, 3000);
        });
    },
    //获取本地钱包信息
    checkIfWalletIsAlreadyRunning() {
      setTimeout(() => {
        client
          .getInfo()
          .then((response) => {
            console.log(response);
            this.getBlockCount();
            this.checkIfWalletIsLoaded();
          })
          .catch((error) => {
            console.log(error);
            if (error.code === 401) {
              // eslint-disable-next-line
              new window.Notification('请关闭维公链客户端程序', {
                body: '程序检测到维公链客户端正在运行，请关闭之后重新打开主节点安装程序。',
              });

              setTimeout(() => {
                const window = remote.getCurrentWindow();
                window.close();
              }, 20000);
            } else {
              setTimeout(() => {
                this.checkIfWalletIsAlreadyRunning();
              }, 2000);
            }
          });
      }, 10000);
    },
  },
  mounted() {
    // this.checkIfWalletIsAlreadyRunning();
  },
};
</script>
<style>

.login h1 {
      color: #fff;
      text-shadow: 0 0 10px rgba(0,0,0,0.3);
      letter-spacing: 1px;
      text-align: center;
      font-size: 2em;
      margin: 0.67em 0;
      display: block;
      font-size: 2em;
      -webkit-margin-before: 0.67em;
      -webkit-margin-after: 0.67em;
      -webkit-margin-start: 0px;
      -webkit-margin-end: 0px;
      font-weight: bold;
  }

.login input {
    width: 100%;
    margin-bottom: 10px;
    background: rgba(0,0,0,0.3);
    border: none;
    outline: none;
    padding: 10px;
    font-size: 13px;
    color: #fff;
    text-shadow: 1px 1px 1px rgba(0,0,0,0.3);
    border: 1px solid rgba(0,0,0,0.3);
    border-radius: 4px;
    box-shadow: inset 0 -5px 45px rgba(100,100,100,0.2), 0 1px 1px rgba(255,255,255,0.2);
    -webkit-transition: box-shadow .5s ease;
    -moz-transition: box-shadow .5s ease;
    -o-transition: box-shadow .5s ease;
    -ms-transition: box-shadow .5s ease;
    transition: box-shadow .5s ease;
    line-height: normal;
}

.btn { display: inline-block; *display: inline; *zoom: 1; padding: 4px 10px 4px; margin-bottom: 0; font-size: 13px; line-height: 18px; color: #333333; text-align: center;text-shadow: 0 1px 1px rgba(255, 255, 255, 0.75); vertical-align: middle; background-color: #f5f5f5; background-image: -moz-linear-gradient(top, #ffffff, #e6e6e6); background-image: -ms-linear-gradient(top, #ffffff, #e6e6e6); background-image: -webkit-gradient(linear, 0 0, 0 100%, from(#ffffff), to(#e6e6e6)); background-image: -webkit-linear-gradient(top, #ffffff, #e6e6e6); background-image: -o-linear-gradient(top, #ffffff, #e6e6e6); background-image: linear-gradient(top, #ffffff, #e6e6e6); background-repeat: repeat-x; filter: progid:dximagetransform.microsoft.gradient(startColorstr=#ffffff, endColorstr=#e6e6e6, GradientType=0); border-color: #e6e6e6 #e6e6e6 #e6e6e6; border-color: rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.25); border: 1px solid #e6e6e6; -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px; -webkit-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05); -moz-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05); cursor: pointer; *margin-left: .3em; }
.btn:hover, .btn:active, .btn.active, .btn.disabled, .btn[disabled] { background-color: #e6e6e6; }
.btn-large { padding: 9px 14px; font-size: 15px; line-height: normal; -webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px; }
.btn:hover { color: #333333; text-decoration: none; background-color: #e6e6e6; background-position: 0 -15px; -webkit-transition: background-position 0.1s linear; -moz-transition: background-position 0.1s linear; -ms-transition: background-position 0.1s linear; -o-transition: background-position 0.1s linear; transition: background-position 0.1s linear; }
.btn-primary, .btn-primary:hover { text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.25); color: #ffffff; }
.btn-primary.active { color: rgba(255, 255, 255, 0.75); }
.btn-primary { background-color: #4a77d4; background-image: -moz-linear-gradient(top, #6eb6de, #4a77d4); background-image: -ms-linear-gradient(top, #6eb6de, #4a77d4); background-image: -webkit-gradient(linear, 0 0, 0 100%, from(#6eb6de), to(#4a77d4)); background-image: -webkit-linear-gradient(top, #6eb6de, #4a77d4); background-image: -o-linear-gradient(top, #6eb6de, #4a77d4); background-image: linear-gradient(top, #6eb6de, #4a77d4); background-repeat: repeat-x; filter: progid:dximagetransform.microsoft.gradient(startColorstr=#6eb6de, endColorstr=#4a77d4, GradientType=0);  border: 1px solid #3762bc; text-shadow: 1px 1px 1px rgba(0,0,0,0.4); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.5); }
.btn-primary:hover, .btn-primary:active, .btn-primary.active, .btn-primary.disabled, .btn-primary[disabled] { filter: none; background-color: #4a77d4; }
.btn-block { width: 100%; display:block; }


</style>
