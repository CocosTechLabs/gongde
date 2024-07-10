import { _decorator, Component, Node, profiler, sys } from 'cc';
import { CocosGameFi, Address, toNano, TonConnectUI } from '@cocos-labs/game-sdk';
import { GameFiInitializationParams, TonTransferRequest } from '@cocos-labs/game-sdk/lib/common/game-fi';
import { TelegramWebApp } from '../cocos-telegram-miniapps/scripts/telegram-web';


const { ccclass, property } = _decorator;
@ccclass('TonSDK')
export class TonSDK {
    private static SERVER_DEBUG_URL: string = "http://127.0.0.1:3000";
    private static SERVER_RELEASE_URL: string = "https://muyu.bolinjoy.com/server";
    private static _instance: TonSDK = null;
    private _cocosGameFi: CocosGameFi;
    private _tonAddress: string = "";
    private _jettonAddress: string = "";
    private _connectUI: TonConnectUI;
    private _bTonInit: boolean;
    private _tgWebApp: any;

    public static getInstance() {
        if (this._instance == null) {
            this._instance = new TonSDK();
        }
        return this._instance
    }

    public async init(url: string) {
        return new Promise<any>(async (resolve, reject) => {
            // https://docs.ton.org/develop/dapps/ton-connect/manifest
            let server = profiler.isShowingStats() ? TonSDK.SERVER_DEBUG_URL : TonSDK.SERVER_RELEASE_URL;
            let config = await fetch(`${server}/config`, {method: 'GET'});
            let res = await config.json()
            console.log("config : ", res);
            let network;
            if (res.ok) {
                this._tonAddress = res.config.tokenRecipient;
                this._jettonAddress = res.config.jettonMaster;
                network  = res.config.network;
            } else {
                console.error('request config failed!');
                return resolve("request config failed!");
            }
            let uiconnector = new TonConnectUI({
                manifestUrl: url
            });
            let params: GameFiInitializationParams = {
                network: network,
                connector: uiconnector,
                merchant: {
                    tonAddress: this._tonAddress,
                    jettonAddress: this._jettonAddress
                }
            }
            this._cocosGameFi = await CocosGameFi.create(params);
            this._connectUI = this._cocosGameFi.walletConnector;
            this._tgWebApp =  TelegramWebApp.Instance;

            this._tgWebApp.init().then(res => {
                console.log("telegram web app init : ", res.success);
                resolve(null);
            });

            const unsubscribeModal = this._connectUI.onModalStateChange(state => {
                console.log("model state changed! : ", state);
                resolve(null);
            });
            const unsubscribeConnectUI = this._connectUI.onStatusChange(info => {
                console.log("wallet info status changed : ", info);
                resolve(null);
            });

            this._bTonInit = true;
            resolve(null);
        });
    }

    public openModal() {
        if (!this._bTonInit) return;
        this._connectUI.openModal();
    }

    public getAccount() {
        if (!this._bTonInit ) return "";
        if (!this._connectUI.account) return "";
        const address = this._connectUI.account.address;
        console.log("account : ", address);
        return Address.parseRaw(address).toString({ testOnly: true, bounceable: false }).substring(0, 6) + '...';
    }

    public closeModal() {
        if (!this._connectUI) {
            console.error("ton ui manager is not inited!");
            return;
        }
        this._connectUI.modal.close();
    }

    public getModal() : any | null {
        if (!this._connectUI) {
            console.error("ton ui manager is not inited!");
            return null;
        }
        // const { modal } = this._connectUI;
        return this._connectUI.modal;
    }

    public getWalletInfo() {
        if (!this._connectUI) {
            console.error("ton ui manager is not inited!");
            return null;
        }
        
        console.log("wallet : ", this._connectUI.wallet);
        console.log("account : ", this._connectUI.account);
        console.log("connected : ", this._connectUI.connected);
    }

    public isConnected(): boolean {
        if (!this._connectUI) {
            console.error("ton ui manager is not inited!");
            return false;
        }
        return this._connectUI.connected;
    }

    public async disconnect() {
        if (!this._connectUI) {
            console.error("ton ui manager is not inited!");
            return;
        }
        await this._connectUI.disconnect();
    }

    public async sendTransaction(transaction: any, notifications?: any): Promise<{result?: any, success: boolean}> {
        if (!this._connectUI) {
            console.error("ton ui manager is not inited!");
            return Promise.resolve({success: false});
        }
        if (!this.isConnected()) {
            console.warn("ton wallect is not connected!");
            return Promise.resolve({success: false});
        }
        
        try {
            const result = await this._connectUI.sendTransaction(transaction, notifications);
            // you can use signed boc to find the transaction 
            // const someTxData = await myAppExplorerService.getTransaction(result.boc);
            // alert('Transaction was sent successfully', someTxData);


            return Promise.resolve({success: true, result: result});
        } catch (e) {
            console.error(e);
            return Promise.resolve({success: false});
        }
    }

    public openTelegramLink(url: string) {
        if (!this._tgWebApp) {
            console.error("telegram web app is not inited!");
            return;
        }
        console.log(url);
        this._tgWebApp.openTelegramLink(url);
    }

    public share(url: string, text?: string) {
        const shareUrl = 'https://t.me/share/url?url=' + url + '&' + new URLSearchParams({ text: text || '' }).toString();
        this.openTelegramLink(shareUrl);
    }

    public getTelegramWebApp() {
        return this._tgWebApp;
    }

    public getTelegramUser() {
        if (!this._tgWebApp) {
            console.error("telegram web app is not inited!");
            return null;
        } 
        return this._tgWebApp.initDataUnsafe;
    }

    public getTelegramUserInitData() {
        if (!this._tgWebApp) {
            console.error("telegram web app is not inited!");
            return null;
        } 
        return this._tgWebApp.initData;
    }

    public alert(message: string) {
        this._tgWebApp.showAlert(message);
    }

    // public transferTon(amount: number) {
    //     const tonTransferReq = {
    //         to: Address.parse(this._tonAddressConfig.tonAddress),
    //         amount: toNano(amount)
    //     } as TonTransferRequest;
    //     this._cocosGameFi.transferTon(tonTransferReq);
    // }


    public buyTon(amount: number) {
        const tonTransferReq = {
            to: Address.parse(this._tonAddress),
            amount: toNano(amount)
        } as TonTransferRequest;
        this._cocosGameFi.transferTon(tonTransferReq);
    }

    public async buyStar(amount: number) {
        let server = profiler.isShowingStats() ? TonSDK.SERVER_DEBUG_URL : TonSDK.SERVER_RELEASE_URL;
        let config = await fetch(`${server}/create-stars-invoice`, {method: 'POST'});
        let res = await config.json()
        console.log("config : ", res);
        if (res.ok) {
            TelegramWebApp.Instance.openInvoice(res.invoiceLink, (result) => {
                console.log("buy stars : ", result);
            });
        } else {
            console.log("starts invoice : ", res);
        }
    }

    public async showJetton() {
        const jettonMasterAddress = Address.parse(this._jettonAddress);
        console.log("jettonMasterAddress", jettonMasterAddress)
        const openJetton = this._cocosGameFi.assetsSdk.openJetton(jettonMasterAddress);
        console.log("openJetton", openJetton)

        return await openJetton.getContent()   
    }

    public getUserInfo() {
        return TelegramWebApp.Instance.getTelegramUser();
    }
    
 
}

