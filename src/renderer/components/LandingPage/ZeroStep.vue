<template>
  <div>

    <div v-if="(!accessToken)&&(!loadding)" id="second-step" class = "login">
      <h1>登陆</h1>
      <input type="text" v-model="userTel" name="u" placeholder="手机号码" required="required" />
      <div style="width:100%;height:50px;justify-content: center;">
        <div style="width:45%;height:20px;float:left;text-align:left;">
          <input type="text" v-model="msgCode"/>
        </div>
        <div style="width:45%;height:50px;float:left;text-align: center;margin: 0 auto;line-height: 40px;">
          <button style="width:90%" disabled="true" v-if="loadTime>0">{{loadTime}}</button>
          <button v-if="loadTime==0" @click="getMsgCode()">获取验证码</button>
        </div>
      </div>
      <button @click="userLogin" class="btn btn-primary btn-block btn-large">登录</button>
    </div>

    <div v-if="accessToken&&(!loadding)&&(!isInstalling)" id="second-step" class = "login">
      <h3>准备就绪，现在开始批量安装主节点!</h3>
      <br>
      <br>
      <button @click="beginInstall" class="btn btn-primary btn-block btn-large">开始安装</button>
    </div>

    <div v-if="loadding" id="second-step">
      <h3>{{loadmsg}}</h3>
      <div class="loading">
        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
      </div>
    </div>
  </div>
</template>

<script>
import Qs from 'qs';
import axios from 'axios';
const remote = require('electron').remote;
const Client = require('@vpubevo/vpub-core');
const client = new Client({
  username: 'mn',
  password: '999000',
  port: 11772,
});

export default {
  data() {
    return {
      isLogin:false,
      blockCount: 0,
      loadding:false,
      loadmsg:'',
      userTel:'',
      msgCode:'',
      loadTime:0,
      uninstallNode:{}
    };
  },
  computed: {
    isInstalling(){
      return this.$store.state.Steps.isInstalling;
    },
    accessToken(){
      return this.$store.state.User.accessToken;
    },
    isEnvPrepared(){
      return this.$store.state.Steps.isEnvPrepared;
    }
  },
  methods: {
    /**
     * 获取区块高度
     */
    getBlockCount() {
      this.loadding = true;
      this.loadmsg = "正在获取区块信息...";
      axios.get(`${this.$store.state.Information.baseUrl}/vp/getblockcount`)
        .then((response) => {
          this.loadding = false;
          console.log("当前区块高度:"+response.data.data);
          this.blockCount = Number(response.data.data);
          this.checkIfWalletIsLoaded();
        }).catch((err) => {
          console.log("获取区块高度失败，5s重新获取");
          setTimeout(() => {
            this.getBlockCount();
          }, 5000);          
        });
    },
    /**
     * 获取本地软件钱包信息
     */
    checkIfWalletIsLoaded() {
      this.loadding = true;
      this.loadmsg = "正在获取本机客户端信息...";
      client
        .getBlockCount()
        .then((response) => {
          console.log("本地钱包数据:");
          console.log(response);
          if (response >= this.blockCount) {
            this.loadding = false;
            console.log('本地同步完毕');
            this.$store.commit('SET_ENVPRE', {
              isEnvPrepared: true,
            });
            
            if(this.isInstalling&&this.accessToken){
              this.beginInstall();
            }

          } else {
            this.loadding = true;
            this.loadmsg = "正在同步区块数据...["+response+"/"+this.blockCount+"]"
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
    /**
     * 检查客户端软件是否运行
     */
    checkIfWalletIsAlreadyRunning() {
      console.log("获取本地前钱包信息");
      this.loadding = true;
      this.loadmsg = "正在检查核心客户端...";
      setTimeout(() => {
        client
          .getInfo()
          .then((response) => {
            console.log(response);
            this.loadding = false;
            this.getBlockCount();
          })
          .catch((error) => {
            console.log(error);
            if (error.code === 401) {
              // eslint-disable-next-line
              new window.Notification('提示', {
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
      }, 1000);
    },
    /**
     * 登陆
     */
    userLogin(){
      axios.post(`${this.$store.state.Information.baseUrl}/mobile/token`, Qs.stringify({
          mobile: this.userTel,
          code: this.msgCode,
          grant_type: 'mobile',
          scope: 'server',
        }),
        {headers:{
          'Content-Type':'application/x-www-form-urlencoded',
          'Authorization':'Basic dnA6dnA='
          }}
        )
        .then(res => {
          let accessToken = res.data.access_token;
          this.$store.commit('SET_USERTOKEN', {
            accessToken: accessToken,
          });
          this.isLogin=true;
        })
        .catch(error => {

        })

    },
    /**
     * 发送验证码
     */
    getMsgCode(){
      if(this.userTel==null||this.userTel==''){
        new window.Notification('提示', {
          body: '请输入用户手机号码。',
        });
        return;
      }
      axios.get(`${this.$store.state.Information.baseUrl}/smsCode/` + this.userTel)
          .then(res => {
            if(res.data.data == false) {
              new window.Notification('提示', {
                body: '验证码发送失败。',
              });
            }else{
              new window.Notification('提示', {
                body: '验证码发送成功。',
              });
            }
          })


    },
    /**
     * 开始批量安装
     */
    beginInstall(){
      if(!this.accessToken){
        new window.Notification('提示', {
          body: '尚未登陆。',
        });
        return;
      }

      axios.get(`${this.$store.state.Information.baseUrl}/bsMasternode/getOneUninstallNode`,{
        headers: {
          Authorization: `Bearer ${this.$store.state.User.accessToken}`
        }})
        .then(res => {
          console.log(res);
          if(res.data.data){
            this.uninstallNode = res.data.data;
            this.$store.commit('SET_NODEDATA', {
              nodeData: this.uninstallNode,
            });
            console.log("开始批量安装主节点");
            this.$store.commit('SET_INSTALL_STATUS', {
              isInstalling: true,
            });
            this.$store.commit('SET_STEP', {
              currentStep: 1,
            });
          }else{
            this.loadmsg="未找到待安装的节点!"
            this.loadding=true;
            this.$store.commit('SET_INSTALL_STATUS', {
              isInstalling: false,
            });
            this.$store.commit('SET_NODEDATA', {
              nodeData: null,
            });
          }
        });
    }
  },
  mounted() {
    this.checkIfWalletIsAlreadyRunning();
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
