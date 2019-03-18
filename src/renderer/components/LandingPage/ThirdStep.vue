<template>
  <div id="step-three">

    <div v-if="myNode" style='width:100%;margin-bottom:25px;font-family:"Microsoft YaHei",微软雅黑,"MicrosoftJhengHei",华文细黑,STHeiti,MingLiu'>
      <p>节点名称:{{$store.state.Information.mnName}}</p>
      <p>节点编码:{{myNode.alias}}</p>
      <p>节点状态:
        <span v-if="myNode.status=='PRE_ENABLED'" style="color:#FF4500;">{{myNode.status|mnStatus}}</span>
        <span v-if="myNode.status=='ENABLED'" style="color:#32CD32;">{{myNode.status|mnStatus}}</span>
        <span v-if="myNode.status=='NEW_START_REQUIRED'" style="color:#FFFF00;">{{myNode.status|mnStatus}}</span>
        <span v-if="myNode.status=='EXPIRED'" style="color:#FF0000;">{{myNode.status|mnStatus}}</span>
        <span v-if="myNode.status=='MISSING'" style="color:#F8F8FF;">{{myNode.status|mnStatus}}</span>
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
        default:
          return '';
          break;
      }
    }
  },
  computed: {
    mnCodeName() {
      return this.$store.state.Information.mnCodeName;
    },
    passphrase() {
      return this.$store.state.Wallet.passphrase;
    },
  },
  methods: {
    //激活主节点
    activateMasterNode() {
      client
        .masternode('start-alias', `${this.mnCodeName}`)
        .then((response) => {
          console.log("start-alias");
          console.log(response);
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
          if (error.code === -13) {
            client
              .walletPassphrase(this.passphrase, 5000)
              .then(() => {
                this.activateMasterNode();
              });
          }
        });
    },
    close() {
      const window = remote.getCurrentWindow();
      window.close();
    },
    closeDaemon(){
      client
        .stop()
        .then(() => {
          console.log("核心程序已退出!");
        });
    },
    restartDaemon(exeType) {
      console.log("重启节点");
      client
        .stop()
        .then(() => {
          this.confVpub();
          setTimeout(() => {
            execFile(`${path.join(__static, `/daemon/${os.platform()}/${exeType}`).replace('app.asar', 'app.asar.unpacked')}`, ['-daemon', '-rpcuser=mn', '-rpcpassword=999000','-rpcport=11772','-server=1','-rpcallowip=127.0.0.1',`-datadir=${this.$store.state.Information.mnConfPath}`]);
          }, 3000);
        });
    },
    //配置维公链配置文件（包括RPC等配置）
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
    //获取当前节点状态
    loadMnList(){ 
      axios.post('http://127.0.0.1:11772/', {
          jsonrpc: '1.0',
          method: 'masternode',
          params: ['list-conf'],
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          auth: {
            username: 'mn',
            password: '999000',
          },
        })
        .then((data) => {
          let mnStr = data.request.responseText;
          mnStr = mnStr.replace('{"masternode":','['); 
          mnStr = mnStr.replace('},"error"','],"error"'); 
          mnStr = mnStr.replace(/"masternode":/g,''); 
          let mnJson = JSON.parse(mnStr); 
          console.log("JSON:",mnJson);
          console.log("mnCodeName",this.mnCodeName);
          let currentConfs=mnJson.result.filter(item => item.alias==this.mnCodeName);
          console.log("currentConfs",currentConfs);
          if(currentConfs==null||currentConfs.length==0){
            console.log("未找到该主节点信息");
            return;
          }
          this.myNode = currentConfs[0];
          console.log("当前主节点状态",this.myNode);
          let ip = this.myNode.address.replace(":9900","");
          switch (this.myNode.status) {
            case "ENABLED":
              //更新主节点状态
              new window.Notification('提示', {
                body: '主节点已成功激活。',
              });
              this.loading=false;
              this.finished=true;
              this.$store.commit('SET_INSTALL_STATUS', {
                isInstalling: false,
              });
              break;

            case "PRE_ENABLED":
              this.loadmsg="正在激活，这可能需要较长时间[约2小时]，请不要关闭程序";
              setTimeout(() => {
                this.loadMnList();
              }, 5000);
              break;

            case "NEW_START_REQUIRED":
              //启动节点
              this.activateMasterNode();
              break;

            case "EXPIRED":
              //启动节点
              this.activateMasterNode();
              break;

            case "MISSING":
              //启动节点
              this.activateMasterNode();
              break;

            default:
              setTimeout(() => {
                this.loadMnList();
              }, 5000);
              break;
          }
        })
        .catch((err) => {
          setTimeout(() => {
              this.loadMnList();
            }, 5000);
        });
    }
  },
  mounted() {
    this.restartDaemon("vpubd");
    this.loading=true;
    this.loadmsg="正在检查主节点状态...";
    setTimeout(() => {
      this.loadMnList();
    }, 5000);
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
