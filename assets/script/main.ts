import { _decorator, Animation, AnimationClip, AnimationComponent, AnimationState, Asset, Button, Component, DebugView, director, game, Input, input, JsonAsset, Label, Node, Root } from 'cc';
import { TonSDK } from './ton-sdk';
import { TelegramWebApp} from './telegram-web-app';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    @property(AnimationComponent) 
    ani: AnimationComponent = null!;

    @property(Node) 
    menuNode: Node = null!;

    @property(Node) 
    shopNode: Node = null!;

    @property(Label) 
    nameLabel: Label = null!;

    @property(Label) 
    jettonLabel: Label = null!;

    private _tonsdk: TonSDK = null!;

    start() {
        this.menuNode.active = false;
        this.shopNode.active = false;
        this.nameLabel.node.active = false;
        this.ani.play("idle");
        this._tonsdk = TonSDK.getInstance();
        this._tonsdk.init("https://muyu.bolinjoy.com/tonconnect-manifest.json").then(() => {
            this.menuNode.active = true;
            let name = this._tonsdk.getAccount();
            if (name) {
                this.nameLabel.node.active = true;
                this.nameLabel.string = this._tonsdk.getAccount();
            }
        });
    }

    protected onEnable(): void {
        input.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
    }

    protected onDisable(): void {
        input.off(Input.EventType.TOUCH_START, this._onTouchStart, this);

    }

    private _onTouchStart() {
        this.ani.play("hit");
        this.ani.once(Animation.EventType.FINISHED, () => {
            this.ani.play("idle");
        })
    }

    update(deltaTime: number) {
        
    }

    public onBtnTonClick() {
        if (this._tonsdk.isConnected()) {
            this._tonsdk.disconnect();
            this.nameLabel.node.active = false;
        } else {
            this._tonsdk.openModal();
        }
       
    }

    public onBtnShareClick() {
        this._tonsdk.share("https://t.me/GongDeBot/GongDe", "Invite you to play an interesting game");
    }
    public async onBtnShopClick() {
        this.shopNode.active = true;
        console.log("await this._tonsdk.showJetton")
        this.jettonLabel.string = "await this._tonsdk.showJetton"
        const jettonContent = await this._tonsdk.showJetton();
        console.log(jettonContent)
        this.jettonLabel.string = jettonContent.name + ": " + jettonContent.decimals
    }

    public onBtnShopCloseClick() {
        this.shopNode.active = false;
    }

    public onBtnBuyTonClick() {
        this._tonsdk.buyTon(0.01);
    }


    public onBtnBuyStarClick() {
        this._tonsdk.buyStar(0.01)
    }

}

