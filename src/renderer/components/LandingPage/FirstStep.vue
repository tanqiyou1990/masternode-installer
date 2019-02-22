<template>
  <div id="first-step">
    <p>当前可用余额: <span class="amount">{{Math.trunc(balance)}}</span> VP</p>

    <div class="separator"></div>

    <div v-if="!isBegin" class="form-group">
      <label for="state">选择一个待安装的主节点:</label>
      <select v-model="choseNode" name="state" id="state" class="state pickout" placeholder="选择一个主节点">
        <option value="99" selected>---请选择---</option>
        <option v-for="(node,index) in myNodes" :key="index" :value="index">{{node.nodeName}}</option>
      </select>
      <button @click="installVps">开始安装</button>
		</div>

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
  port: 9902,
});

export default {
  data() {
    return {
      mnCodeName:null,
      mnName:null,
      isBegin:false,
      loadding:false,
      loadmsg:'',
      choseNode:null,
      myNodes:[],
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
  },
  methods: {
    //向账户充值1000VP
    sendVP(){
      client
        .getNewAddress("MN启动金-"+this.$store.state.Information.mnId)
          .then((address) => {
            this.loadding=true;
            this.loadmsg="正在接收平台启动金，请等待..."
            let param = {
              address:address,
              amount:'1000.1',
              mid:this.mnId,
              type:'1'
            };
            axios.post(`${this.$store.state.Information.baseUrl}/vp/transaction`,param,{
            headers: {
              Authorization: `Bearer ${this.$store.state.User.accessToken}`
            }})
              .then((response) => {
                console.log(response);
                if(response.data.success){
                  //更新主节点状态
                  this.updateMnStaus('9');
                  //如果当前余额足够，则可以提前进行主节点安装
                  if(Number(this.$store.state.Wallet.balance)>=1000.1){
                    this.loadmsg="启动金发放成功..."
                    setTimeout(() => {
                      console.log("余额足够，提前安装");
                      this.getCurrentMasternodes();
                    }, 3000); 
                  }else{
                    this.watchTransinfo(response.data.data.txHash);
                  }
                }else{
                  new window.Notification('错误', {
                    body: '接收平台启动金失败：'+response.data.msg,
                  });
                }
              })
              .catch((err) => {
                new window.Notification('错误', {
                  body: '接收平台资金报错：'+err,
                });
              });
          })
          .catch((err) => {
            new window.Notification('错误', {
              body: '生成收款地址出错',
            });
          });
    },
    //获取待安装列表
    getMyNodes(){
      this.loadding = true;
      this.loadmsg = "加载主节点信息...";
      axios.get(`${this.$store.state.Information.baseUrl}/bsMasternode/myNodes/0`,{
        headers: {
          Authorization: `Bearer ${this.$store.state.User.accessToken}`
        }})
        .then((response) => {
          this.loadding = false;
          this.myNodes = response.data.data;
          if(!this.myNodes.length){
            new window.Notification('提示', {
              body: '未找到待安装的主节点记录。',
            });
          }
          this.choseNode=99;//默认选项
          console.log(response);
        }).catch((err) => {
          console.log(err)
          this.loadding = false;
          new window.Notification('错误', {
            body: '获取待安装主节点信息出错。',
          });
        });
    },
    //监控交易信息
    watchTransinfo(txHash){
      axios.get(`https://pl.vpubchain.net/api/getrawtransaction?txid=${txHash}&decrypt=1`)
        .then((response) => {
          console.log(response);
          if(response.data.confirmations){
            if(Number(response.data.confirmations)>=6){
              this.getCurrentBalance();
              setTimeout(() => {
                if(Number(this.$store.state.Wallet.balance)>=1000.1){
                  console.log("余额大于1000.1");
                  this.getCurrentMasternodes();
                }else{
                  this.watchTransinfo(txHash);
                }
              }, 5000);
            }else{
              this.loadmsg=`正在接收平台启动金，交易确认中（${response.data.confirmations}/6）...`
              setTimeout(() => {
                this.watchTransinfo(txHash);
              }, 5000); 
            }
          }else{
            setTimeout(() => {
              this.watchTransinfo(txHash);
            }, 5000); 
          }
        })
        .catch((err) => {
          console.log("查询交易信息出错:"+err);
          setTimeout(() => {
            this.watchTransinfo(txHash);
          }, 5000); 
        });
    },
    //更新主节点状态
    updateMnStaus(staus){
      console.log("开始更新主节点状态!");
      let param = {
        id:this.$store.state.Information.mnId,
        status:staus,
        step:"99"
      };
      axios.post(`${this.$store.state.Information.baseUrl}/bsMasternode/update`,param,{
        headers: {
          Authorization: `Bearer ${this.$store.state.User.accessToken}`
        }})
        .then((response) => {
          if(response.data.success){
            //开始转账
            console.log("更新主节点状态成功!");
          }
        })
        .catch((err) => {
          console.log("更新主节点状态失败!");
        });
    },
    installVps(){
      if(this.myNodes==null||this.myNodes.length==0){
        new window.Notification('提示', {
          body: '您尚未购买主节点，请前往平台官网购买!',
        });
        return;
      }
      if(this.choseNode=='99'||this.choseNode==99){
        new window.Notification('提示', {
          body: '请选择需要安装的主节点。',
        });
        return;
      }
      this.$store.commit('SET_MNID', {
        mnId: this.myNodes[this.choseNode].id,
      }); 
      this.mnName = this.myNodes[this.choseNode].nodeName;
      this.$store.commit('SET_MNNAME', {
        mnName: this.mnName,
      }); 
      //设置一个主节点CODE，不能有汉字
      this.mnCodeName = `MN${Math.round(new Date().getTime() / 1000)}`;
      this.$store.commit('SET_MNCODENAME', {
        mnCodeName: this.mnCodeName,
      });
      this.isBegin=true;
      //开始转账
      this.sendVP();
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
            balance,
          });
        });
    },
    compareMasternodes() {
      axios.post('http://127.0.0.1:9902/', {
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
        // eslint-disable-next-line
        for (const key in response.data.result) {
          // eslint-disable-next-line
          if (response.data.result.hasOwnProperty(key)) {
            this.outputs.push({
              txid: key,
              txnumber: response.data.result[key],
            });
          }
        }

        if (this.outputs.length) {
          for(let i =0;i<this.outputs.length;i++){
           let isAvailable = true;
            for(let j=0;j<this.currentMasternodes.length;j++){
              if(String(this.currentMasternodes[j].txid)===String(this.outputs[i].txid) 
              && Number(this.currentMasternodes[j].txnumber)===Number(this.outputs[i].txnumber)){
                // console.log(this.outputs[i].txid,this.outputs[i].txnumber,this.currentMasternodes[j].txid,this.currentMasternodes[j].txnumber,"相等");
                isAvailable=false
                break;
              }
              // console.log(this.outputs[i].txid,this.outputs[i].txnumber,this.currentMasternodes[j].txid,this.currentMasternodes[j].txnumber,"不等");
            }

            if(isAvailable){
              // console.log("加入：",this.outputs[i]);
              this.availableMasternodesToInstall.push(this.outputs[i]);
            }
          }

          // Double filtering with different methods. Removing duplicates.
          this.availableMasternodesToInstall = this.availableMasternodesToInstall
            .filter((masternode, index, self) =>
              index === self.findIndex(t => t.txid === masternode.txid &&
                t.txnumber === masternode.txnumber),
            );
          
          console.log("availableMasternodesToInstall:",this.availableMasternodesToInstall);

          this.installMasternode();
        } else {
          this.installMasternode();
        }
      }).catch((error) => {
        console.error('Error getting the masternode outputs', error);
        setTimeout(() => {
          this.compareMasternodes();
        }, 5000);
      });
    },
    comparer(otherArray) {
      return current => otherArray
        // eslint-disable-next-line
        .filter(other => other.txid == current.txid && other.txnumber == current.txnumber)
        .length === 0;
    },
    getOuputsFromTxId(txId) {
      this.availableMasternodesToInstall = [];
      // eslint-disable-next-line
      for (let i = 1; i <= Number(this.masternodesToInstall); i += 1) {
        this.availableMasternodesToInstall.push({
          txid: txId,
          txnumber: i,
        });
      }
      console.log('Outputs found', this.availableMasternodesToInstall);

      this.installMasternode();
    },
    installMasternode() {
      console.log('Awesome! we can install');
      console.log(this.availableMasternodesToInstall);
      if (this.availableMasternodesToInstall &&
        this.availableMasternodesToInstall.length >= 1) {

        // Get firsts available outputs
        const output = this.availableMasternodesToInstall.slice(0,1);
        this.$store.commit('SET_OUTPUT', {
          output:output[0],
        });

        //获取txid对应的account
        axios.get(`https://pl.vpubchain.net/api/getrawtransaction?txid=${output[0].txid}&decrypt=1`)
          .then((response) => {

          let outlist = response.data.vout;
          console.log(outlist);
          if(outlist!=null&&outlist.length>0){
            outlist=outlist.filter(item => item.value==1000||item.value=='1000');
          }
          if(outlist!=null){
            this.$store.commit('SET_MNACCOUNT', {
                  mnAccount: outlist[0].scriptPubKey.addresses[0],
                });
          }
          console.log("主节点配置信息:",this.$store.state.Information);
        });


        // Generate Privkeys
        client
          .masternode('genkey')
            .then((response) => {
              if(response){
                this.$store.commit('SET_GENKEY', {
                  genkey:response,
                });
                // Start Installation
                this.$store.commit('SET_STEP', {
                  currentStep: 2,
                });
              }
            });
      } else {
        console.log('not available masternodes');
        const accountsToGenerate = Number(this.masternodesToInstall);
        // Create new wallet
        client
          .getNewAddress(`${this.mnName}base`)
          .then((address) => {
            console.log('New Address Generated', address);
            console.log('accounts to generate', accountsToGenerate);
            const baseaddress = address;
            // Send 1000 XMN
            client
              .sendToAddress(baseaddress,
                accountsToGenerate === 1 ? 1000 : ((accountsToGenerate * 1000) + 1))
              .then((txid) => {
                console.log('basetxid', txid);
                this.$store.commit('SET_MNACCOUNT', {
                  mnAccount: address,
                });
                if (accountsToGenerate === 1) {
                  // Restart Install Masternode
                  this.compareMasternodes();
                } else {
                  const generateAddressesArray = [];
                  for (let i = 0; i < accountsToGenerate; i += 1) {
                    generateAddressesArray.push(client.getNewAddress(`${this.mnName}-${i}`));
                  }
                  Promise.all(generateAddressesArray)
                    .then((wallets) => {
                      const sendAddresses = {};

                      wallets.forEach((wallet) => {
                        sendAddresses[wallet] = 1000;
                      });

                      client
                        .sendMany(`${this.mnName}base`, sendAddresses, 0)
                        .then((txid) => {
                          console.log('sendManyTxId', txid);
                          // Restart Install Masternode
                          this.getOuputsFromTxId(txid);
                        })
                        .catch((error) => {
                          console.error('Error sending mn funds', error);
                        });
                    })
                    .catch((error) => {
                      console.error('Error generating the mn wallets', error);
                    });
                }
              })
              .catch((error) => {
                console.log('Error sending funds to base address', error);
              });
          });
      }
    },
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

          // if(this.currentMasternodes!=null&&this.currentMasternodes.length>0){
          //   for(let i=0;i<this.currentMasternodes.length;i++){
          //     if(this.currentMasternodes[i].name==null||this.currentMasternodes[i].name==''){
          //       this.currentMasternodes = this.currentMasternodes.splice(i,1);
          //     }
          //   }
          // }

        console.log('current masternodes:', this.currentMasternodes);

        this.compareMasternodes();
      });
    },
    getCurrentMasternodes() {
      let datadirPath = this.$store.state.Information.mnConfPath;

      if (fs.existsSync(`${datadirPath}/masternode.conf`)) {
        console.log('masternode.conf file found');
        this.readCurrentMasternodes(`${datadirPath}/masternode.conf`);
      } else {
        console.log('datadir', datadirPath);
        // datadirPath = `${os.userInfo().homedir}/AppData/Roaming/VpubCore`;
        datadirPath = this.$store.state.Information.mnConfPath;
        if (os.platform() === 'darwin') {
          datadirPath =
         `${os.userInfo().homedir}/Library/Application Support/VpubCore`;
        }
        if (os.platform() === 'linux') {
          datadirPath = `${os.userInfo().homedir}/.vpubcore`;
        }
        if (fs.existsSync(`${datadirPath}/masternode.conf`)) {
          this.readCurrentMasternodes(`${datadirPath}/masternode.conf`);
        } else {
          console.error('Unable to reach the masternode.conf file');
        }
      }
    },
    checkForPassphrase() {
      client
        .getInfo()
        .then((info) => {
          if (Object.prototype.hasOwnProperty.call(info, 'unlocked_until')) {
            this.$modal.show('passphrase');
          }
        });
    },
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
  mounted() {
    this.checkForPassphrase();
    this.getCurrentBalance();
    this.getMyNodes();
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
