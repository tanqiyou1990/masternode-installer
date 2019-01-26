<template>
  <div id="second-step">
    <div class="progress-bar">
      <h2>维公链-主节点安装</h2>
      <progress class="progress" :value="dropletIp.progress" max="100">{{dropletIp.progress}}%</progress>
      <small>{{dropletIp.currentStatus}}</small>
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
      dropletIp: {progress:0},
      fill: { gradient: ['#1E8DE0', '#348584'] },
      DOAvailableRegions: [],
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
    lookForIp() {
      console.log('监听IP安装配置进度:');
      //获取服务器安装进度
      axios.get(`${this.$store.state.Information.baseUrl}/bsMasternode/getStep?mid=${this.mnId}`,{
            headers: {
              Authorization: `Bearer ${this.$store.state.User.accessToken}`
            }})
            .then((response) => {
                if(response.data){
                  this.dropletIp.currentVpsStep = Number(response.data);
                }else{
                  this.dropletIp.currentVpsStep = 0;
                }
                this.dropletIp.progress = 7.69 * this.dropletIp.currentVpsStep;
                if (this.dropletIp.currentVpsStep === 1) {
                  this.dropletIp.currentStatus = 'VPS创建完毕...';
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                } else if (this.dropletIp.currentVpsStep === 2) {
                  this.dropletIp.currentStatus = '正在扩展虚拟内存...';
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                } else if (this.dropletIp.currentVpsStep === 3) {
                  this.dropletIp.currentStatus = '系统更新中...';
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                } else if (this.dropletIp.currentVpsStep === 4) {
                  this.dropletIp.currentStatus = '安装基础工具包...';
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                } else if (this.dropletIp.currentVpsStep === 5) {
                  this.dropletIp.currentStatus = '安装fail2ban...';
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                } else if (this.dropletIp.currentVpsStep === 6) {
                  this.dropletIp.currentStatus = '配置防火墙...';
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                } else if (this.dropletIp.currentVpsStep === 7) {
                  this.dropletIp.currentStatus = '设置程序配置文件...';
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                } else if (this.dropletIp.currentVpsStep === 8) {
                  this.dropletIp.currentStatus = '下载维公链核心程序...';
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                } else if (this.dropletIp.currentVpsStep === 9) {
                  this.dropletIp.currentStatus = '安装维公链依赖包...';
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                } else if (this.dropletIp.currentVpsStep === 10) {
                  this.dropletIp.currentStatus = '启动维公链核心程序...';
                  setTimeout(() => {
                    this.lookForIp();
                  }, 5000);
                } else if (this.dropletIp.currentVpsStep === 11) {
                  this.dropletIp.currentStatus = '安装哨兵程序...';
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
                } else if (this.dropletIp.currentVpsStep === 12) {
                  axios.get('https://paas.vpubchain.org/bsMasternode/getCounter?mid='+this.mnId)
                    .then((response) => {
                      let currentCount = Number(response.data);
                      this.dropletIp.currentStatus = `区块同步中,这可能需要一点时间... 同步进度 ${currentCount} / ${this.totalBlocks}.`;
                      setTimeout(() => {
                        this.lookForIp();
                      }, 10000);
                    }).catch((err) =>{
                      console.log(err);
                      setTimeout(() => {
                        this.lookForIp();
                      }, 5000);
                    });
                } else if (this.dropletIp.currentVpsStep === 13) {
                  this.dropletIp.currentStatus = '主节点安装完成!';
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
                      `\n${this.mnCodeName} ${this.dropletIp.ip}:9900 ${this.dropletIp.privkey} ${this.dropletIp.output} ${this.dropletIp.txNumber}`);
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
    createDroplet(genkey, name) {
      axios.post('https://api.digitalocean.com/v2/droplets', {
        name,
        region: this.DOAvailableRegions[Math.floor(Math.random() * this.DOAvailableRegions.length)],
        size: 's-1vcpu-1gb',
        image: 'ubuntu-16-04-x64',
        ipv6: false,
        tags: ['vpub', 'masternode'],
        user_data: `#cloud-config
package_upgrade: true

packages:
  - nano
  - wget
  - unzip
  - curl

runcmd:
  - wget https://www.vpubchain.info/files/masternode.sh
  - chmod +x masternode.sh
  - ./masternode.sh ${genkey} ${this.$store.state.Information.mnId} ${this.$store.state.User.accessToken}`,
      }, {
        headers: {
          Authorization: `Bearer ${this.$store.state.Information.accessToken}`,
        },
      })
      // eslint-disable-next-line
        .then((response) => {
          return new Promise((resolve) => {
            // eslint-disable-next-line
            setTimeout(() => {
              resolve(axios.get(`https://api.digitalocean.com/v2/droplets/${response.data.droplet.id}`, {
                headers: {
                  Authorization: `Bearer ${this.$store.state.Information.accessToken}`,
                },
              }));
            }, 120000);
          });
        })
        .then((response) => {
          this.dropletIp.ip = response.data.droplet.networks.v4[0].ip_address;
          this.$store.commit('SET_IP', {
            ip: response.data.droplet.networks.v4[0].ip_address,
          });
          if (response.data.droplet && response.data.droplet.id) {
            this.updateMnStaus(response.data.droplet.networks.v4[0].ip_address,genkey,this.$store.state.Information.output.txid,this.$store.state.Information.output.txnumber);
            this.lookForIp();
          } else {
            this.createDroplet(genkey, name);
          }
        })
        .catch((e) => {
          if (!this.dropletIp.retriedInstall) {
            this.dropletIp.retriedInstall = true;
            this.createDroplet(genkey, name);
          }
          console.error('Error', e);
        });
    },
    //获取当前已有的主节点配置
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
    iterateCreateDroplet() {
      console.log('Droplets to create:', 1);
      this.dropletIp = {
        ip: null,
        currentVpsStep: 0,
        progress: 0,
        currentStatus: '正在安装主机... 这可能需要花费几分钟时间.',
        privkey: this.$store.state.Information.genkey,
        output: this.$store.state.Information.output.txid,
        txNumber: this.$store.state.Information.output.txnumber,
        retriedInstall: false,
      };
      this.createDroplet(this.$store.state.Information.genkey, `vpub-${this.mnCodeName}`);
    },
    getDigitalOceanAvailableRegions() {
      console.log(this.$store.state.Information);
      axios.get('https://api.digitalocean.com/v2/regions', {
        headers: {
          Authorization: `Bearer ${this.$store.state.Information.accessToken}`,
        },
      }).then((response) => {
        this.DOAvailableRegions = response.data.regions
          .filter(region => region.available && region.sizes.includes('s-1vcpu-1gb'))
          .map(region => region.slug);
        this.iterateCreateDroplet();
      }).catch((err) => {
        console.log("获取服务器区域失败,5s重新获取:");
        setTimeout(() => {
          this.getDigitalOceanAvailableRegions();
        }, 5000);
      });
    },
    checkCondition(){
      if(this.mnCodeName&&this.mnConfPath&&this.mnId){
        return true;
      }else{
        return false;
      }
    },
    //更新主节点状态
    updateMnStaus(ip,genkey,txid,txindex){
      console.log("开始更新主节点状态!");
      let param = {
        id:this.$store.state.Information.mnId,
        mnAccount:this.$store.state.Information.mnAccount,
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
    this.getDigitalOceanAvailableRegions();
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
