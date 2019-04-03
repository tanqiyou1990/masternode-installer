<template>
  <div id="first-step">
    <p>当前可用余额: <span class="amount">{{Math.trunc(balance)}}</span> VP</p>

    <div class="separator"></div>

    <div v-if="loadding">
      <h3>{{loadmsg}}</h3>
      <div class="loading">
        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
      </div>
    </div>
    <modal name="passphrase" 
      :adaptive="true"
      :clickToClose="false"
      class="prompt"
      width="80%"
      height="30%">
      <div class="modal-container" v-bind:class="{ error: incorrectPassphrase }">
        <form @submit.prevent="unlockWallet">
          <p>输入钱包密码，解锁您本地的钱包:</p>
          <input type="password" v-model="passphrase" />
          <button type="submit">解锁</button>
        </form>
      </div>
    </modal>
  </div>
</template>

<script>
import os from 'os';
import fs from 'fs';
import axios from 'axios';
const Client = require('@vpubevo/vpub-core');
const client = new Client({
  username: 'mn',
  password: '999000',
  port: 11772,
});

export default {
  data() {
    return {
      loadding:false,
      loadmsg:'',
      outputs: [],
      availableMasternodesToInstall: [],
      currentMasternodes: null,
      xmnaddresses: [],
      passphrase: '',
      incorrectPassphrase: false,
      masternodesToInstall: 1,    //暂时开放一次只能生成一个MsterNode
    };
  },
  computed: {
    balance() {
      return this.$store.state.Wallet.balance;
    },
    nodeData(){
      return this.$store.state.InstallNode.nodeData;
    }
  },
  methods: {

    /**
     * 向地址发送10000.1VP
     */
    sendVP(address){
      //开始转账
      console.log("#######开始转账#######");
      this.loadding=true;
      this.loadmsg="正在接收平台启动金，请等待..."
      let param = {
        address:address,
        amount:'10000.1',
        mid:this.nodeData.id,
        type:'1'
      };
      axios.post(`${this.$store.state.Information.baseUrl}/vp/transaction`,param,{
      headers: {
        Authorization: `Bearer ${this.$store.state.User.accessToken}`
      }})
        .then((response) => {
          if(response.data.success){
            this.loadmsg="启动金发放成功..."
            //开始检查余额
            this.checkBalance();
          }else{
            new window.Notification('错误', {
              body: '接收平台启动金失败：'+response.data.msg,
            });
          }
        })
        .catch((err) => {
          new window.Notification('错误', {
            body: '接收平台资金出错5s后重试：'+err,
          });
          setTimeout(() => {
            this.sendVP(address);
          },5000);
        });
    },

    /**
     * 生成地址接收10000VP
     */
    createMnAddress(){
      client
      .getNewAddress("MN平台发放启动金-"+this.nodeData.nodeName)
        .then((address) => {
          this.sendVP(address);
        })
        .catch((err) => {
          new window.Notification('错误', {
            body: '生成收款地址出错,5s后重试',
          });
          setTimeout(() => {
            this.createMnAddress();
          },5000);
        });
    },
    /**
     * 检查余额是否足够
     */
    checkBalance(){

      client
        .listUnspent()
        .then((unspent) => {
          let balance = 0;
          unspent
            .filter(tx => tx.spendable)
            .forEach((tx) => {
              balance += tx.amount;
            });
          this.$store.commit('SET_BALANCE', {
            balance:balance
          });
          if(Number(this.$store.state.Wallet.balance)>=10000.05){
            setTimeout(() => {
              console.log("余额足够，开始安装");
              //余额足够开始安装
              this.getCurrentMasternodes();
            }, 3000); 
          }else{
            this.loadmsg="启动金发放成功，等待启动金到账..."
            setTimeout(() => {
              this.checkBalance();
            },2000);
          }

        })
        .catch((err) => {
          console.log("获取余额失败",err);
          setTimeout(() => {
            this.checkBalance();
          },2000);
        });


    },
    //获取当前钱包余额
    getCurrentBalance() {
      client
        .listUnspent()
        .then((unspent) => {
          let balance = 0;
          unspent
            .filter(tx => tx.spendable)
            .forEach((tx) => {
              balance += tx.amount;
            });
          this.$store.commit('SET_BALANCE', {
            balance:balance
          });
        })
        .catch((err) => {
          console.log("获取余额失败",err);
        });
    },
    /**
     * 对比已经配置的主节点信息得到可用的主节点信息
     */
    compareMasternodes() {
      axios.post('http://127.0.0.1:11772/', {
        jsonrpc: '1.0',
        method: 'masternode',
        params: ['outputs'],
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: 'mn',
          password: '999000',
        },
      }).then((response) => {
        console.log("outputs:",response);
        this.outputs = response.data.result;
        if (this.outputs.length) {
          for(let i =0;i<this.outputs.length;i++){
            let isAvailable = true;
            for(let j=0;j<this.currentMasternodes.length;j++){
              if(this.currentMasternodes[j]!=null&&this.currentMasternodes[j]!=''&&this.currentMasternodes[j]!=undefined&&(String(this.currentMasternodes[j].txhash)===String(this.outputs[i].txhash) 
              && Number(this.currentMasternodes[j].outputidx)===Number(this.outputs[i].outputidx))){
                isAvailable=false
                break;
              }
            }

            if(isAvailable){
              this.availableMasternodesToInstall.push(this.outputs[i]);
            }
          }

          // Double filtering with different methods. Removing duplicates.
          this.availableMasternodesToInstall = this.availableMasternodesToInstall
            .filter((masternode, index, self) =>
              index === self.findIndex(t => t.txhash === masternode.txhash &&
                t.outputidx === masternode.outputidx),
            );

          if(!this.availableMasternodesToInstall.length){
            this.sendToSelf();
          }else{
            this.installMasternode();
          }

        } else{
          this.sendToSelf();
        }
      }).catch((error) => {
        console.error('Error getting the masternode outputs', error);
        setTimeout(() => {
          this.compareMasternodes();
        }, 5000);
      });
    },
    /**
     * 根据txId查找交易信息，并获取对应的交易地址
     */
    findTxInfo(txhash){
      //获取txid对应的account
      axios.get(`https://pl.vpubchain.net/api/getrawtransaction?txid=${txhash}&decrypt=1`)
        .then((response) => {
          let outlist = response.data.vout;
          if(outlist!=null&&outlist.length>0){
            outlist=outlist.filter(item => item.value==10000||item.value=='10000');
          }
          if(outlist!=null){
            this.$store.commit('SET_MNACCOUNT', {
              mnAccount: outlist[0].scriptPubKey.addresses[0],
            });
          }
        })
        .catch(err => {
          console.log("获取交易账户信息失败!",err);
          setTimeout(() => {
            this.findTxInfo(txhash);
          },2000);
        })
    },
    /**
     * 检查是否满足下一步要求
     */
    checkNextStep(){
      if(
      this.$store.state.InstallNode.nodeData&&
      this.$store.state.Information.mnConfPath&&
      this.$store.state.Information.mnAccount&&
      this.$store.state.Information.genkey)
      {

        // Start Installation
        console.log("满足要求,进入下一步");
        this.$store.commit('SET_STEP', {
          currentStep: 2,
        });
      }else{
        console.log("安装过程出现了点错误");
        this.loadding=true;
        this.loadmsg="正在检查状态...";
        setTimeout(() => {
          this.checkNextStep();
        },2000);
      }
    },
    /**
     * 安装主节点
     */
    installMasternode() {
      console.log('Awesome! we can install');
      if(!this.availableMasternodesToInstall.length){
        console.log("尚未发现可安装的节点，5s后再次尝试安装");
        setTimeout(() => {
          this.installMasternode();
        },5000);
      }else{
        // Get firsts available outputs
        const output = this.availableMasternodesToInstall.slice(0,1);
        this.$store.commit('SET_OUTPUT', {
          output:output[0],
        });
        this.findTxInfo(output[0].txhash);
        // Generate Privkeys
        client
          .masternode('genkey')
            .then((response) => {
              if(response){
                this.$store.commit('SET_GENKEY', {
                  genkey:response,
                });
                this.checkNextStep();
              }
            });
      }
    },
    
    /**
     * 质押金发送
     */
    sendToSelf(){
      this.loadmsg="正在准备质押金...";
        client
          .getNewAddress(`${this.nodeData.nodeName}base`)
          .then((address) => {
            console.log('New Address Generated', address);
            console.log('accounts to generate', 1);
            // Send 10000 VP
            client
              .sendToAddress(address,10000)
              .then((txhash) => {
                console.log('成功质押：', txhash);
                setTimeout(() => {
                  this.checkSendSelf(txhash);
                },20000);
              })
              .catch((error) => {
                console.log('Error sending funds to base address', error);
                setTimeout(() => {
                  this.sendToSelf();
                },5000);
              });
          });
    },
    /**
     * 检查质押是否生效
     */
    checkSendSelf(txhash){
      axios.post('http://127.0.0.1:11772/', {
          jsonrpc: '1.0',
          method: 'masternode',
          params: ['outputs'],
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          auth: {
            username: 'mn',
            password: '999000',
          },
        }).then((response) => {
          let opts = response.data.result;
          if(!opts.length){
            setTimeout(() => {
              this.checkSendSelf(txhash);
            },10000);
          }else{
            opts = opts.filter(item => item.txhash==txhash);
            if(opts.length){
              this.compareMasternodes();
            }else{
              this.loadmsg="正在获取OutPuts信息..."
              setTimeout(() => {
                this.checkSendSelf(txhash);
              },10000);
            }

          }
        })
        .catch(err => {
          console.log("获取output出错!",err);
          setTimeout(() => {
            this.checkSendSelf(txhash);
          },10000);
        });
    },
    /**
     * 获取当前已经配置的主节点信息存入currentMasternodes
     */
    readCurrentMasternodes(path) {
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) throw err;
        const lines = data.split('\n');
        this.currentMasternodes = lines
          .filter(line => line[0] !== '#')
          .map((line) => {
            const parts = line.split(' ');
            let tempStr = line.replace(/\s+/g,"");
            if(tempStr!=null&&tempStr!=''&&parts[0]!=null&&parts[0]!=''){
              return {
                name: parts[0],
                ip: parts[1],
                privkey: parts[2],
                txhash: parts[3],
                outputidx: parts[4],
              };
            }
          });
        this.compareMasternodes();
      });
    },
    /**
     * 获取当前已经配置的主节点
     */
    getCurrentMasternodes() {
      let datadirPath = this.$store.state.Information.mnConfPath;

      if (fs.existsSync(`${datadirPath}/masternode.conf`)) {
        console.log('masternode.conf file found');
        this.readCurrentMasternodes(`${datadirPath}/masternode.conf`);
      } else {
        console.log('datadir', datadirPath);
        // datadirPath = `${os.userInfo().homedir}/AppData/Roaming/Vpub`;
        datadirPath = this.$store.state.Information.mnConfPath;
        if (os.platform() === 'darwin') {
          datadirPath =
         `${os.userInfo().homedir}/Library/Application Support/Vpub`;
        }
        if (os.platform() === 'linux') {
          datadirPath = `${os.userInfo().homedir}/.vpub`;
        }
        if (fs.existsSync(`${datadirPath}/masternode.conf`)) {
          this.readCurrentMasternodes(`${datadirPath}/masternode.conf`);
        } else {
          console.error('Unable to reach the masternode.conf file');
        }
      }
    },
    /**
     * 判断钱包是否解锁
     */
    checkForPassphrase() {
      client
        .getInfo()
        .then((info) => {
          if (Object.prototype.hasOwnProperty.call(info, 'unlocked_until')) {
            this.$modal.show('passphrase');
          }
        })
        .catch((err) => {
          console.log(err);
          setTimeout(() => {
            this.checkForPassphrase();
          },1000);
        });
    },
    /**
     * 解锁钱包
     */
    unlockWallet() {
      this.incorrectPassphrase = false;
      client
        .walletPassphrase(this.passphrase, 5000)
        .then(() => {
          this.$store.commit('SET_PASSPHRASE', {
            passphrase: this.passphrase,
          });
          this.$modal.hide('passphrase');
        })
        .catch((error) => {
          if (error.code === -14) {
            this.incorrectPassphrase = true;
          }
        });
    },
  },
  created() {
    if(this.nodeData!=null){
      this.checkForPassphrase();
      this.createMnAddress();
    }
  },
};
</script>

<style lang="scss" scoped>
#first-step {
  margin-top: 30px;
  width: 90%;
}

p {
  font-weight: normal;

  span.amount {
    font-weight: lighter;
    margin-left: 40px;
  }
}

.do-logo {
  margin: 60px auto 20px;
  display: block;
}

ul.buttons {
  list-style: none;
  margin: 50px auto;
  text-align: center;

  li {
    display: inline-block;
    margin-right: 50px;

    &:last-child {
      margin-right: 0;
    }
  }
}

.form-group {
		width:100%;
		float:left;
		margin:5px 0;
	}

	label{
		margin-bottom:10px;
		float:left;			
	}

	.field-input, select{
		/* width:calc(100% - 20px);
		float:left;
		padding:10px;
		font-family:inherit; */

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
</style>

<style lang="scss">
.v--modal {
  background-color: #1E8DE0 !important;
  box-shadow: 0 20px 60px -2px rgba(27, 33, 58, 0.58);
}

.v--modal-box {
  background-color: #1E8DE0 !important;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;

  p {
    color: #fff;
  }

  .modal-container {
    width: 80%;
    margin: 0 auto;

    p {
      margin-bottom: 20px;
    }

    input {
      width: 100%;
      height: 30px;
      border-radius: 5px;
      border: none;
      background-color: #fff;
      margin-bottom: 20px;
      padding-left: 10px;
      padding-right: 10px;
    }

    &.error {
      animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
      transform: translate3d(0, 0, 0);
      backface-visibility: hidden;
      perspective: 1000px;
    }

    button {
      background-color: #001B38;
      margin: 0 auto;
      display: block;

      &:hover {
        background-color: darken(#001B38, 10%);
      }
    }
  }
}
@keyframes shake {
  10%, 90% {
    transform: translate3d(-1px, 0, 0);
  }
  
  20%, 80% {
    transform: translate3d(2px, 0, 0);
  }

  30%, 50%, 70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%, 60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
