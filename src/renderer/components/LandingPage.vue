<template>
  <div id="wrapper">
    <img id="logo" src="~@/assets/LOGO.png" alt="Vpub">
    <h1 class="title">维公链主节点安装程序</h1>
    <main>
      <div class="steps-content">
        <zero-step v-if="currentStep === 0 || !currentStep" />
        <first-step v-if="currentStep === 1" />
        <second-step v-if="currentStep === 2" />
        <third-step v-if="currentStep === 3" />
      </div>
      <steps v-if="balance >= 1000" />
    </main>
  </div>
</template>

<script>
import { execFile } from 'child_process';
import path from 'path';
import os from 'os';
import { chmod, existsSync } from 'fs';
import Registry from 'winreg';
import bplist from 'bplist-parser';
import ZeroStep from './LandingPage/ZeroStep';
import FirstStep from './LandingPage/FirstStep';
import SecondStep from './LandingPage/SecondStep';
import ThirdStep from './LandingPage/ThirdStep';
import Steps from './Steps';
const remote = require('electron').remote;

const Client = require('@vpubevo/vpub-core');
const client = new Client({
  username: 'mn',
  password: '999000',
  port: 9902,
});

export default {
  data(){
    return {
      closeTime:0
    };
  },
  name: 'landing-page',
  components: {
    ZeroStep,
    FirstStep,
    SecondStep,
    ThirdStep,
    Steps
  },
  computed: {
    balance() {
      return this.$store.state.Wallet.balance;
    },
    currentStep() {
      return this.$store.state.Steps.currentStep;
    },
  },
  methods: {
    runDaemon() {
      
      if (this.$store.state.Information.mnConfPath) {
        execFile(`${path.join(__static, `/daemon/${os.platform()}/vpubd`)
          .replace('app.asar', 'app.asar.unpacked')}`,
        ['-rpcuser=mn', '-rpcpassword=999000', `-datadir=${this.$store.state.Information.mnConfPath}`],
        (error, stdout, stderr) => {
          if (error) {
            // eslint-disable-next-line
            // new window.Notification('即将关闭你的钱包程序', {
            //   body: '检测到运行中的钱包程序，系统正尝试关闭钱包程序。',
            // });
            setTimeout(() => {
              //尝试关闭客户端
              this.closeDaemon();
            }, 10000);
          }
          console.log(stderr);
          console.log(stdout);
        });
      } else {
        // eslint-disable-next-line
        new window.Notification('未检测到维公链核心程序', {
          body: '请前往维公链官网下载安装程序，安装完成之后之后再次运行本程序.',
        });
      }
    },
    closeDaemon(){
      client
        .stop()
        .then(() => {
          console.log("核心程序已退出!");
          this.runDaemon();
        }).catch(() =>{
            new window.Notification('请关闭钱包程序', {
              body: '检测到运行中的钱包程序，请关闭钱包程序后，重新运行主节点安装程序。',
            });
            setTimeout(() => {
              const window = remote.getCurrentWindow();
              window.close();
            }, 10000);
        });
    },
  },
  mounted() {
    chmod(`${path.join(__static, `/daemon/${os.platform()}/vpubd${os.platform() === 'win32' ? '.exe' : ''}`).replace('app.asar', 'app.asar.unpacked')}`,
      '0777', (err) => {
        if (err) {
          console.log(err);
        }

        if (os.platform() === 'darwin') {
          if (existsSync(`${os.userInfo().homedir}/Library/Preferences/org.vpub.Vpub-Qt.plist`)) {
            bplist.parseFile(`${os.userInfo().homedir}/Library/Preferences/org.vpub.Vpub-Qt.plist`, (err, plistData) => {
              if (err) throw err;

              this.$store.commit('SET_MNCONFPATH', {
                mnConfPath: plistData[0].strDataDir,
              });
              this.runDaemon();
            });
          } else {
            this.runDaemon();
          }
        } else if (os.platform() === 'win32') {
          const registryData = new Registry({
            hive: Registry.HKCU,
            key: '\\SOFTWARE\\VPUB\\VPUB-QT',
          });

          registryData.values((err, items) => {
            if (err) { console.log(`ERROR: ${err}`); } else {
              for (let i = 0; i < items.length; i += 1) {
                if (items[i].name === 'strDataDir') {
                  this.$store.commit('SET_MNCONFPATH', {
                    mnConfPath: items[i].value,
                  });
                  this.runDaemon();
                }
              }
            }
          });
        } else if (os.platform() === 'linux') {
          this.$store.commit('SET_MNCONFPATH', {
            mnConfPath: `${os.userInfo().homedir}/.vpubcore`,
          });
          this.runDaemon();
        }
      });
  },
};
</script>

<style lang="scss">
  @import url('https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body { font-family: 'Open Sans', sans-serif; }

  #wrapper {
    background-color: $brand-color;
    height: 100vh;
    padding: 60px 40px;
    width: 100vw;
  }

  #logo {
    height: auto;
    margin-bottom: 20px;
    width: 80%;
    margin-left: auto;
    margin-right: auto;
    display: block;
  }

  h1.title {
    text-align: center;
    font-weight: lighter;
    font-size: 1.4em;
  }

  .steps-content {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 400px;
  }
</style>
