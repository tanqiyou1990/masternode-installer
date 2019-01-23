<template>
  <div id="second-step">
    <div class="progress-bar" v-for="(droplet, index) in dropletIps" :key="index">
      <h2>维公链-主节点安装</h2>
      <progress class="progress" :value="droplet.progress" max="100">{{droplet.progress}}%</progress>
      <small>{{droplet.currentStatus}}</small>
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
      dropletIps: [],
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
    mnName() {
      return this.$store.state.Information.mnName;
    },
    mnConfPath() {
      return this.$store.state.Information.mnConfPath;
    },
  },
  methods: {
    lookForIp(ip, index) {
      console.log('监听IP安装配置进度:', ip);
      //获取服务器安装进度
      axios.get('https://paas.vpubchain.org/nodeInstall/getStep?ip='+ip)
                .then((response) => {
                    console.log("服务器安装进度："+response.data);
                    this.dropletIps[index].currentVpsStep = Number(response.data);
                    this.dropletIps[index].progress = 9.09 * this.dropletIps[index].currentVpsStep;
                    if (this.dropletIps[index].currentVpsStep === 1) {
                      this.dropletIps[index].currentStatus = '正在安装主机... 预计需要几分钟时间';
                      setTimeout(() => {
                        this.lookForIp(ip, index);
                      }, 5000);
                    } else if (this.dropletIps[index].currentVpsStep === 2) {
                      this.dropletIps[index].currentStatus = '设置SWAP...';
                      setTimeout(() => {
                        this.lookForIp(ip, index);
                      }, 5000);
                    } else if (this.dropletIps[index].currentVpsStep === 3) {
                      this.dropletIps[index].currentStatus = '更新系统...';
                      setTimeout(() => {
                        this.lookForIp(ip, index);
                      }, 5000);
                    } else if (this.dropletIps[index].currentVpsStep === 4) {
                      this.dropletIps[index].currentStatus = '安装基础工具包...';
                      setTimeout(() => {
                        this.lookForIp(ip, index);
                      }, 5000);
                    } else if (this.dropletIps[index].currentVpsStep === 5) {
                      this.dropletIps[index].currentStatus = '安装fail2ban...';
                      setTimeout(() => {
                        this.lookForIp(ip, index);
                      }, 5000);
                    } else if (this.dropletIps[index].currentVpsStep === 6) {
                      this.dropletIps[index].currentStatus = '配置防火墙...';
                      setTimeout(() => {
                        this.lookForIp(ip, index);
                      }, 5000);
                    } else if (this.dropletIps[index].currentVpsStep === 7) {
                      this.dropletIps[index].currentStatus = '设置程序配置文件...';
                      setTimeout(() => {
                        this.lookForIp(ip, index);
                      }, 5000);
                    } else if (this.dropletIps[index].currentVpsStep === 8) {
                      this.dropletIps[index].currentStatus = '下载维公链核心程序...';
                      setTimeout(() => {
                        this.lookForIp(ip, index);
                      }, 5000);
                    } else if (this.dropletIps[index].currentVpsStep === 9) {
                      this.dropletIps[index].currentStatus = '安装哨兵程序...';
                      axios.get('https://pl.vpubchain.net/api/getblockcount')
                        .then((response) => {
                          this.totalBlocks = Number(response.data);
                        }).catch((err) =>{
                          console.log(err);
                          setTimeout(() => {
                            this.lookForIp(ip, index);
                          }, 5000);
                        });
                      setTimeout(() => {
                        this.lookForIp(ip, index);
                      }, 5000);
                    } else if (this.dropletIps[index].currentVpsStep === 10) {
                      axios.get('https://paas.vpubchain.org/nodeInstall/getCounter?ip='+ip)
                        .then((response) => {
                          let currentCount = Number(response.data);
                          this.dropletIps[index].currentStatus = `区块同步中... 这可能需要一点时间... 同步进度 ${currentCount} / ${this.totalBlocks}.`;
                        }).catch((err) =>{
                          console.log(err);
                          setTimeout(() => {
                            this.lookForIp(ip, index);
                          }, 5000);
                        });
                      setTimeout(() => {
                        this.lookForIp(ip, index);
                      }, 10000);
                    } else if (this.dropletIps[index].currentVpsStep === 11) {
                      this.dropletIps[index].currentStatus = '主节点安装完成!';
                      this.readCurrentMasternodes(`${this.mnConfPath}/masternode.conf`);
                      let isWritein = false;
                      for(let i=0;i<this.currentMasternodes.length;i++){
                        if(this.currentMasternodes[i].name==`${this.mnName}-${index}`){
                          isWritein=true;
                        }
                      }
                      if(!isWritein){
                        console.log("写入主节点配置文件");
                        fs.appendFileSync(`${this.mnConfPath}/masternode.conf`,
                          `\n${this.mnName}-${index} ${this.dropletIps[index].ip}:9900 ${this.dropletIps[index].privkey} ${this.dropletIps[index].output} ${this.dropletIps[index].txNumber}`);
                      }
                      this.lookForSecureChangeStep();
                    }else{
                      setTimeout(() => {
                        this.lookForIp(ip, index);
                      }, 5000);
                    }
                }).catch((err) => {
                  console.log(err);
                  setTimeout(() => {
                    this.lookForIp(ip, index);
                  }, 5000);
                });
    },
    createDroplet(genkey, name, index) {
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
  - ./masternode.sh ${genkey} -y installer`,
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
          this.dropletIps[index].ip = response.data.droplet.networks.v4[0].ip_address;
          this.$store.commit('SET_IP', {
            ip: response.data.droplet.networks.v4[0].ip_address,
          });
          if (response.data.droplet && response.data.droplet.id) {
            this.lookForIp(response.data.droplet.networks.v4[0].ip_address, index);
          } else {
            this.createDroplet(genkey, name, index);
          }
        })
        .catch((e) => {
          if (!this.dropletIps[index].retriedInstall) {
            this.dropletIps[index].retriedInstall = true;
            this.createDroplet(genkey, name, index);
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
      const dropletsToCreate = this.$store.state.Information.genkeys.length;
      console.log('Droplets to create:', dropletsToCreate);

      for (let i = 0; i < dropletsToCreate; i += 1) {
        this.dropletIps.push({
          ip: null,
          currentVpsStep: 0,
          progress: 0,
          currentStatus: '正在安装主机... 这可能需要花费几分钟时间.',
          privkey: this.$store.state.Information.genkeys[i],
          output: this.$store.state.Information.outputs[i].txid,
          txNumber: this.$store.state.Information.outputs[i].txnumber,
          retriedInstall: false,
        });
        this.createDroplet(this.$store.state.Information.genkeys[i], `xmn-${this.mnName}-${i}`, i);
      }
    },
    lookForSecureChangeStep() {
      const unfinishedDroplets = this.dropletIps.filter(droplet => droplet.currentVpsStep !== 11);
      if (!unfinishedDroplets.length) {
        this.$store.commit('SET_STEP', {
          currentStep: 3,
        });
      }
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
  },
  mounted() {
    this.getDigitalOceanAvailableRegions();
  },
  beforeDestroy(){
    clearInterval(this.lookStepTimer);
  },
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
