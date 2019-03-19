<template>
  <div id="second-step">
    <div class="progress-bar">
      <h2>维公链-主节点安装</h2>
      <progress class="progress" :value="vpsInstance.progress" max="100">{{vpsInstance.progress}}%</progress>
      <small>{{vpsInstance.currentStatus}}</small>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import fs from 'fs';
import { clearInterval } from 'timers';

export default {
  data() {
    return {
      vpsInstance: {progress:0},
      fill: { gradient: ['#1E8DE0', '#348584'] },
      totalBlocks: 0,
      currentMasternodes:[]
    };
  },
  computed: {
    currentStep() {
      return this.$store.state.Steps.currentStep;
    },
    mnCodeName(){
      return this.$store.state.Information.mnCodeName
    },
    mnId() {
      return this.$store.state.Information.mnId;
    },
    mnConfPath() {
      return this.$store.state.Information.mnConfPath;
    },
  },
  methods: {
    /**
     * 获取服务器安装进度
     */
    lookForIp() {
      console.log('监听IP安装配置进度:');
      axios.get(`${this.$store.state.Information.baseUrl}/bsMasternode/getStep?mid=${this.mnId}`,{
            headers: {
              Authorization: `Bearer ${this.$store.state.User.accessToken}`
            }})
            .then((response) => {
                if(response.data){
                  this.vpsInstance.currentVpsStep = Number(response.data);
                }else{
                  this.vpsInstance.currentVpsStep = 0;
                }
                this.vpsInstance.progress = 7.69 * this.vpsInstance.currentVpsStep;
                if (this.vpsInstance.currentVpsStep === 99) {
                  this.vpsInstance.currentStatus = '正在转入主节点押金...';
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                } else if (this.vpsInstance.currentVpsStep === 1) {
                  this.vpsInstance.currentStatus = '正在创建VPS...';
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                } else if (this.vpsInstance.currentVpsStep === 2) {
                  this.vpsInstance.currentStatus = '正在配置运行环境...';
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                } else if (this.vpsInstance.currentVpsStep === 3) {
                  this.vpsInstance.currentStatus = '正在启动客户端程序...';
                  axios.get('https://pl.vpubchain.net/api/getblockcount')
                    .then((response) => {
                      this.totalBlocks = Number(response.data);
                      setTimeout(() => {
                        this.lookForIp();
                      }, 5000);
                    }).catch((err) =>{
                      console.log(err);
                      setTimeout(() => {
                        this.lookForIp();
                      }, 5000);
                    });
                } else if (this.vpsInstance.currentVpsStep === 4) {
                  axios.get('https://paas.vpubchain.org/bsMasternode/getCounter?mid='+this.mnId,{
                    headers: {
                      Authorization: `Bearer ${this.$store.state.User.accessToken}`
                    }})
                    .then((response) => {
                      let currentCount = Number(response.data);
                      this.vpsInstance.currentStatus = `区块同步中,这可能需要一点时间... 同步进度 ${currentCount} / ${this.totalBlocks}.`;
                      setTimeout(() => {
                        this.lookForIp();
                      }, 10000);
                    }).catch((err) =>{
                      console.log(err);
                      setTimeout(() => {
                        this.lookForIp();
                      }, 5000);
                    });
                } else if (this.vpsInstance.currentVpsStep === 100) {
                  this.vpsInstance.currentStatus = '主节点安装完成!';
                  this.readCurrentMasternodes(`${this.mnConfPath}/masternode.conf`);
                  let isWritein = false;
                  for(let i=0;i<this.currentMasternodes.length;i++){
                    if(this.currentMasternodes[i].name==`${this.mnCodeName}`){
                      isWritein=true;
                    }
                  }
                  if(!isWritein){
                    console.log("写入主节点配置文件");
                    fs.appendFileSync(`${this.mnConfPath}/masternode.conf`,
                      `\n${this.mnCodeName} ${this.vpsInstance.ip}:11771 ${this.vpsInstance.privkey} ${this.vpsInstance.output} ${this.vpsInstance.txNumber}`);
                  }
                  this.$store.commit('SET_STEP', {
                    currentStep: 3,
                  });
                }else{
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                }
            }).catch((err) => {
              console.log(err);
              setTimeout(() => {
                this.lookForIp();
              }, 5000);
            });
    },
    /**
     * 创建虚拟主机
     */
    createVPS(genkey, name) {
      let param={
        hostName:name,
        mnKey:genkey,
        mnId: this.$store.state.Information.mnId
      };
      axios.post('https://paas.vpubchain.org/vps/create',param,{
        headers: {
          Authorization: `Bearer ${this.$store.state.User.accessToken}`
        },
      }).then((response) => {
        console.log("第一个：",response);
          return new Promise((resolve) => {
            // eslint-disable-next-line
            setTimeout(() => {
              resolve(axios.post(`https://paas.vpubchain.org/vps/getDetail`,{
                instanceId:response.data.data.instanceId
              }, {
                headers: {
                  Authorization: `Bearer ${this.$store.state.User.accessToken}`
                },
              }));
            }, 120000);
          });
        })
        .then((response) => {
          console.log("第二个：",response);
          this.vpsInstance.ip = response.data.data.publicIP;
          this.$store.commit('SET_IP', {
            ip: this.vpsInstance.ip,
          });
          if (this.vpsInstance.ip) {
            this.updateMnStaus(this.vpsInstance.ip,genkey,this.$store.state.Information.output.txid,this.$store.state.Information.output.txnumber);
            this.lookForIp();
          } else {
            this.createVPS(genkey, name);
          }
        })
        .catch((e) => {
          if (!this.vpsInstance.retriedInstall) {
            this.vpsInstance.retriedInstall = true;
            this.createVPS(genkey, name);
          }
          console.error('Error', e);
        });
    },
    /**
     * 获取当前已有的主节点配置
     */
    readCurrentMasternodes(path) {
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) throw err;
        const lines = data.split('\n');
        this.currentMasternodes = lines
          .filter(line => line[0] !== '#')
          .map((line) => {
            const parts = line.split(' ');
            return {
              name: parts[0],
              ip: parts[1],
              privkey: parts[2],
              txid: parts[3],
              txnumber: parts[4],
            };
          });
      });
    },
    /**
     * 开始安装主节点
     */
    iteratecreateVPS() {
      console.log('Droplets to create:', 1);
      this.vpsInstance = {
        ip: null,
        currentVpsStep: 0,
        progress: 0,
        currentStatus: '正在安装主机... 这可能需要花费几分钟时间.',
        privkey: this.$store.state.Information.genkey,
        output: this.$store.state.Information.output.txid,
        txNumber: this.$store.state.Information.output.txnumber,
        retriedInstall: false,
      };
      this.createVPS(this.$store.state.Information.genkey, `vpub-${this.mnCodeName}`);
    },
    /**
     * 检查参数前置任务是否完成
     */
    checkCondition(){
      if(this.mnCodeName&&this.mnConfPath&&this.mnId){
        return true;
      }else{
        return false;
      }
    },
    /**
     * 更新主节点信息
     */
    updateMnStaus(ip,genkey,txid,txindex){
      console.log("开始更新主节点状态!");
      let param = {
        id:this.$store.state.Information.mnId,
        account:this.$store.state.Information.mnAccount,
        ip:ip,
        genkey:genkey,
        txid:txid,
        txindex:txindex
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
    //如果条件不成立，需返回上一步
    if(!this.checkCondition()){
      this.$store.commit('SET_STEP', {
        currentStep: 1,
      });
    }
    this.iteratecreateVPS();
  }
};
</script>

<style lang="scss" scoped>
#second-step {
  width: 90%;
  margin: 0 auto;
  max-height: 100%;
  overflow: auto;
  padding-right: 30px;
}

progress {
  -webkit-appearance: none;
  border: none;
  border-radius: 290486px;
  display: block;
  height: 1rem;
  overflow: hidden;
  padding: 0;
  width: 100%;

  &::-webkit-progress-value {
    background-color: #1E8DE0;
    transition: all 0.7s;
  }

  &::-webkit-progress-bar {
    background-color:#dbdbdb;
  }
}

.progress-bar {
  margin-bottom: 30px;
}
</style>
