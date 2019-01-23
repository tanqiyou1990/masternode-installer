<template>
  <div id="second-step">
    <h1>Syncing Wallet...</h1>
    <div class="loading">
      <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { setTimeout } from 'timers';
const remote = require('electron').remote;
const Client = require('motion-core');
const client = new Client({
  username: 'mn',
  password: '999000',
  // port: 9902,
  port: 9902,
});

export default {
  data() {
    return {
      blockCount: 0,
    };
  },
  methods: {
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
              }, 1000);
            }
          });
      }, 10000);
    },
  },
  mounted() {
    this.checkIfWalletIsAlreadyRunning();
  },
};
</script>
