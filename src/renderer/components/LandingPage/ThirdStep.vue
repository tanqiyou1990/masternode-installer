<template>
  <div id="step-three">

    <div v-if="myNode" style='width:100%;margin-bottom:25px;font-family:"Microsoft YaHei",微软雅黑,"MicrosoftJhengHei",华文细黑,STHeiti,MingLiu'>
      <p>节点名称:{{$store.state.InstallNode.nodeData.nodeName}}</p>
      <p>节点状态:
        <span v-if="myNode.status=='PRE_ENABLED'" style="color:#FF4500;">{{myNode.status|mnStatus}}</span>
        <span v-if="myNode.status=='ENABLED'" style="color:#32CD32;">{{myNode.status|mnStatus}}</span>
        <span v-if="myNode.status=='NEW_START_REQUIRED'" style="color:#FFFF00;">{{myNode.status|mnStatus}}</span>
        <span v-if="myNode.status=='EXPIRED'" style="color:#FF0000;">{{myNode.status|mnStatus}}</span>
        <span v-if="myNode.status=='MISSING'" style="color:#F8F8FF;">{{myNode.status|mnStatus}}</span>
        <span v-if="myNode.status=='ACTIVE'" style="color:#FFD700;">{{myNode.status|mnStatus}}</span>
      </p>
    </div>

    <div class="loading" v-if="loading">
      <h3>{{loadmsg}}</h3>
      <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
    </div>

    <h3 v-if="finished">主节点激活成功!</h3>
    <div class="finished">
      <button @click="close()" v-if="finished" :disabled="!finished">关闭</button>
    </div>
  </div>
</template>

<script>
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import qs from 'qs';
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
      myNode:null,
      loading: false,
      finished: false,
      loadmsg: '',
      currentConfs:[],
      nodeStatus:null
    };
  },
  filters:{
    mnStatus(val){
      switch (val) {
        case 'ENABLED':
          return '运行中';
          break;
        case 'PRE_ENABLED':
          return '准备中';
          break;
        case 'NEW_START_REQUIRED':
          return '需重启';
          break;
        case 'EXPIRED':
          return '已过期';
          break;
        case 'MISSING':
          return '未启动';
          break;
        case 'ACTIVE':
          return '激活中';
          break;
        default:
          return '未知状态';
          break;
      }
    }
  },
  computed: {
    passphrase() {
      return this.$store.state.Wallet.passphrase;
    },
    nodeData(){
      return this.$store.state.InstallNode.nodeData;
    }
  },
  methods: {
    /**
     * 激活主节点
     */
    activateMasterNode() {
      axios.post('http://127.0.0.1:11772/', {
          jsonrpc: '1.0',
          method: 'startmasternode',
          params: ['alias','false',this.nodeData.nodeName],
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          auth: {
            username: 'mn',
            password: '999000',
          },
        })
        .then((response) => {
          console.log("start-alias",response);
          if (response.result=="failed") {
            this.loading = true;
            this.loadmsg = '区块数据同步中...'
            setTimeout(() => {
              this.activateMasterNode();
            }, 10000);
          }else{
            setTimeout(() => {
              this.loadMnList();
            }, 25000);
          }
        })
        .catch((error) => {
          console.log("error:",error)
          console.log("s");
          if (error.code === -13) {
            client
              .walletPassphrase(this.passphrase, 5000)
              .then(() => {
                this.activateMasterNode();
              });
          }else{
            setTimeout(() => {
              this.loadMnList();
            },25000);
          }
        });
    },
    /**
     * 关闭安装助手
     */
    close() {
      const window = remote.getCurrentWindow();
      window.close();
    },
    /**
     * 关闭客户端程序
     */
    closeDaemon(){
      client
        .stop()
        .then(() => {
          console.log("核心程序已退出!");
        });
    },
    /**
     * 重启客户端程序
     */
    restartDaemon() {
      console.log("重启节点");
      client
        .stop()
        .then(() => {
          this.confVpub();
          setTimeout(() => {
              execFile(`${path.join(__static, `/daemon/${os.platform()}/vpubd`)
                .replace('app.asar', 'app.asar.unpacked')}`,
              ['-rpcuser=mn', '-rpcpassword=999000','-rpcport=11772','-rpcallowip=127.0.0.1','-server=1', `-datadir=${this.$store.state.Information.mnConfPath}`],
              (error, stdout, stderr) => {
                if (error) {
                  console.log("启动出错");
                  setTimeout(() => {
                    //尝试关闭客户端
                    console.log("尝试关闭客户端");
                    this.closeDaemon();
                  }, 10000);
                }
                console.log(stderr);
                console.log(stdout);
              });
          }, 3000);
        });
    },

    /**
     * 配置维公链配置文件（包括RPC等配置）
     */
    confVpub(){
      if (fs.existsSync(`${this.$store.state.Information.mnConfPath}/vpub.conf`)) {
        console.log('vpub.conf file found');
        //获取当前配置
        fs.readFile(`${this.$store.state.Information.mnConfPath}/vpub.conf`, 'utf8', (err, data) => {
          if (err) throw err;
          const lines = data.split('\n');
          this.currentConfs = lines
            .filter(line => line[0] !== '#')
            .map((line) => {
              const parts = line.split('=');
              return {
                property: parts[0],
                value:parts[1]
              };
            });
          console.log('current Confs:', this.currentConfs);
          let haverpcuser=false;
          let haverpcpassword=false;
          let haverpcport=false;
          let haveserver=false;
          let haverpcallowip=false;
          let havedaemon=false;
          
          //配置RPC
          if(this.currentConfs!=null&&this.currentConfs.length>0){
            for(let i=0;i<this.currentConfs.length;i++){
              if(this.currentConfs[i].property==null||this.currentConfs[i].property==''){
                this.currentConfs = this.currentConfs.splice(i,1);
              }else{
                switch (this.currentConfs[i].property) {
                  case 'rpcuser':
                    haverpcuser=true;
                    break;
                  case 'rpcpassword':
                    haverpcpassword=true;
                    break;
                  case 'rpcport':
                    haverpcport=true;
                    break;        
                  case 'server':
                    haveserver=true;
                    break; 
                  case 'rpcallowip':
                    haverpcallowip=true;
                    break;    
                  case 'daemon':
                    havedaemon=true;
                    break;  

                  default:
                    break;
                }
              }
            }
          }

          if(!haverpcuser){
            fs.appendFileSync(`${this.$store.state.Information.mnConfPath}/vpub.conf`,
                        `\nrpcuser=mn`);
          }
          if(!haverpcpassword){
            fs.appendFileSync(`${this.$store.state.Information.mnConfPath}/vpub.conf`,
                        `\nrpcpassword=999000`);
          }
          if(!haverpcport){
            fs.appendFileSync(`${this.$store.state.Information.mnConfPath}/vpub.conf`,
                        `\nrpcport=11772`);
          }
          if(!haveserver){
            fs.appendFileSync(`${this.$store.state.Information.mnConfPath}/vpub.conf`,
                        `\nserver=1`);
          }
          if(!haverpcallowip){
            fs.appendFileSync(`${this.$store.state.Information.mnConfPath}/vpub.conf`,
                        `\nrpcallowip=127.0.0.1`);
          }
          if(!havedaemon){
            fs.appendFileSync(`${this.$store.state.Information.mnConfPath}/vpub.conf`,
                        `\ndaemon=1`);
          }

        });
      }
    },
    /**
     * 获取当前节点状态
     */
    loadMnList(){ 
      axios.get(`${this.$store.state.Information.baseUrl}/vp/getMyNodeStatus/${this.nodeData.id}`,{
      headers: {
        Authorization: `Bearer ${this.$store.state.User.accessToken}`
      }})
        .then(response => {
          if(response.data.success){
            //成功获取到主节点状态信息
            let rpcStatus = response.data.data;

            console.log(rpcStatus);

            let msg = rpcStatus.message;

            if(msg&&msg.indexOf("successfully") != -1){  //表示启动成功
              //更新主节点状态
              new window.Notification('提示', {
                body: "["+this.nodeData.nodeName+"]已成功激活。",
              });

              this.loadmsg="节点激活成功，5s后安装下一个主节点...";
              setTimeout(() => {
                //返回首页继续安装
                this.$store.commit('SET_STEP', {
                  currentStep: 0,
                });
              },5000);
            }else{
              //启动节点
              this.activateMasterNode();
            }
          }else{
            //获取主节点状态失败
            this.loadmsg="["+this.nodeData.nodeName+"]激活中，请稍等...";
            setTimeout(() => {
              this.activateMasterNode();
            },5000);
          }
        })
        .catch(err => {
            this.loadmsg="["+this.nodeData.nodeName+"]激活中，请稍等...";
            setTimeout(() => {
              this.activateMasterNode();
            },5000);          
        });
    }
  },
  mounted() {
    this.restartDaemon();
    this.loading=true;
    this.loadmsg="正在检查["+this.nodeData.nodeName+"]状态...";
    setTimeout(() => {
      this.loadMnList();
    }, 10000);
  },
};
</script>


<style lang="scss" scoped>
.finished {
  margin-top: 50px;
  clear: both;
  text-align: center;
}

button {
  font-size: 1.2em;
  font-weight: lighter;
}

button[disabled] {
  opacity: 0.4;
}
</style>
