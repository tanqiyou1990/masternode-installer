<template>
  <div id="step-three">
    <button @click="activateMasterNode()" v-if="!(loading||finished)">激活主节点</button>
    <div class="loading" v-if="loading">
      <h3>{{loadmsg}}</h3>
      <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
    </div>
    <!-- <h2>主节点安装成功</h2>
    <p>点击关闭主节点安装程序，然后打开钱包，在Masternodes页签启动主节点.</p> -->
    <h3 v-if="finished">主节点激活成功!</h3>
    <div class="finished">
      <button @click="close()" v-if="finished" :disabled="!finished">关闭</button>
    </div>
  </div>
</template>

<script>
import { execFile } from 'child_process';
import path from 'path';
import os from 'os';
import axios from 'axios';
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
      loading: false,
      finished: false,
      loadmsg: '',
    };
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
    //通过ADDNODE向主节点发送包
    addNode(ip){
      axios.post('http://127.0.0.1:9902/', {
          jsonrpc: '1.0',
          method: 'addnode',
          params: [ip,"onetry"],
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
          console.log("Addnode result:"+response);
        })
        .catch((err) => {
          console.log(err);
        });
    },
    //监控主节点运行状态
    watchMnStatus(codeName){
      axios.post('http://127.0.0.1:9902/', {
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

          let mnList = mnJson.result;
          for( let i=0;i<mnList.length;i++){
            let mnConf = mnList[i];
            if(mnConf.alias==codeName){
              console.log("当前状态:"+mnConf.status);
              if(mnConf.status=='ENABLED'){
                this.loading = false;
                //更新主节点状态
                this.updateMnStaus("1");
                this.finished = true;
                this.closeDaemon();
                // eslint-disable-next-line
                new window.Notification('提示', {
                  body: '主节点已激活成功，您可以重新打开电脑的钱包客户端查看主节点运行情况！',
                });
              }else if(mnConf.status=='PRE_ENABLED'){
                //主节点状态为启动前检查
                this.loadmsg="请等待主节点启动...当前状态为 "+mnConf.status;
                let ip = mnConf.address;
                ip=ip.replace(":9900","");
                this.addNode(ip);
                setTimeout(() => {
                  this.watchMnStatus(codeName);
                }, 5000);
              }else if(mnConf.status=='NEW_START_REQUIRED'){
                this.loadmsg="请等待主节点启动...当前状态为 "+mnConf.status;
                setTimeout(() => {
                  this.activateMasterNode();
                }, 5000);
              }else if(mnConf.staus == 'EXPIRED'){
                this.loadmsg="请等待主节点启动...当前状态为 "+mnConf.status;
                setTimeout(() => {
                  this.activateMasterNode();
                }, 5000);
              }else{
                this.loadmsg="请等待主节点启动...当前状态为 "+mnConf.status;
                setTimeout(() => {
                  this.activateMasterNode();
                }, 5000);
              }
            }else{
                this.loadmsg="请等待主节点启动...";
                setTimeout(() => {
                  this.activateMasterNode();
                }, 5000);
            }
          }
        })
        .catch((err) => {
          console.log("查询状态失败!");
          setTimeout(() => {
              this.watchMnStatus(codeName);
            }, 5000);
        });
    },
    activateMasterNode() {
      client
        .masternode('start-alias', `${this.mnCodeName}`)
        .then((response) => {
          console.log("start-alias");
          if (response.errorMessage) {
            this.loading = true;
            this.loadmsg = '区块数据同步中...'
            setTimeout(() => {
              this.activateMasterNode();
            }, 10000);
          } else if (response.result == 'successful') {
            this.loadmsg = '正在检查主节点状态...'
            //监控主节点是否ENABLE
            this.watchMnStatus(this.mnCodeName);
          }else {
            setTimeout(() => {
              this.activateMasterNode();
            }, 10000);
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
    restartDaemon() {
      console.log("重启节点");
      client
        .stop()
        .then(() => {
          setTimeout(() => {
            execFile(`${path.join(__static, `/daemon/${os.platform()}/vpubd`).replace('app.asar', 'app.asar.unpacked')}`, ['-daemon', '-rpcuser=mn', '-rpcpassword=999000','-rpcport=9902','-server=1','-rpcallowip=127.0.0.1',`-datadir=${this.$store.state.Information.mnConfPath}`]);
          }, 1000);
        });
    },
    updateMnStaus(staus){
      console.log("开始更新主节点状态!");
      let param = {
        id:this.$store.state.Information.mnId,
        status:staus
      };
      axios.post(`${this.$store.state.Information.baseUrl}/bsMasternode/update`,param,{
        headers: {
          Authorization: `Bearer ${this.$store.state.User.accessToken}`
        }})
        .then((response) => {
          if(response.data.success){
            console.log("更新主节点状态成功!");
          }
        })
        .catch((err) => {
          console.log("更新主节点状态失败!");
        });
    },
  },
  mounted() {
    // eslint-disable-next-line
    new window.Notification('主节点安装成功', {
      body: '程序开始重启维公链客户端后台程序.',
    });

    this.restartDaemon();
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
