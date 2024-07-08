import { _decorator, Animation, AnimationClip, AnimationComponent, AnimationState, Asset, assetManager, Button, Component, DebugView, director, game, ImageAsset, Input, input, JsonAsset, Label, Node, Root, Sprite, SpriteFrame, Texture2D } from 'cc';
import { TonSDK } from './ton-sdk';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    @property(AnimationComponent) 
    ani: AnimationComponent = null!;

    @property(Node) 
    menuNode: Node = null!;

    @property(Node) 
    shopNode: Node = null!;


    @property(Node) 
    infoNode: Node = null!;

    @property(Label) 
    nameLabel: Label = null!;

    @property(Label) 
    idLabel: Label = null!;

    @property(Sprite) 
    iconSprite: Sprite = null!;

    @property(SpriteFrame) 
    iconSpriteFrame: SpriteFrame = null!;

    @property(Label) 
    jettonLabel: Label = null!;

    private _tonsdk: TonSDK = null!;

    start() {
        this.menuNode.active = false;
        this.shopNode.active = false;
        this.infoNode.active = false;
        this.ani.play("idle");
        this._tonsdk = TonSDK.getInstance();
        this._tonsdk.init("https://muyu.bolinjoy.com/tonconnect-manifest.json").then(() => {
            this.menuNode.active = true;
            this._showUserInfo()
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
            this.infoNode.active = false;
        } else {
            this._tonsdk.openModal();
        }
       
    }

    public onBtnShareClick() {
        let userId = '';
        const userData = this._tonsdk.getUserInfo();
        console.log("userData : ", userData);
        if (userData) {
            userId = userData.id + '';
        }
        this._tonsdk.share("https://t.me/GongDeBot/GongDe?startapp=ref_code_" + userId, "Invite you to play an interesting game");
    }

    public async onBtnShopClick() {
        this.shopNode.active = true;
        console.log("await this._tonsdk.showJetton")
        // this.jettonLabel.string = "await this._tonsdk.showJetton"
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

    private _showUserInfo() {
        this.infoNode.active = true;
        this.idLabel.string = "";
        this.nameLabel.string = "";
        this.iconSprite.spriteFrame = this.iconSpriteFrame;

        this.idLabel.string = this._tonsdk.getAccount();
        let userData = this._tonsdk.getUserInfo();
        console.log("userData : ", userData);
        if (userData) {
            this.infoNode.active = true;
            // load username
            if (userData.username) {
                this.nameLabel.string = userData.username;
            } else {
                this.nameLabel.string = userData.first_name + ' ' + userData.last_name ? userData.last_name : '';
            }

            // load profile photo
            if (userData.photo_url) {
                const fileExtension = userData.photo_url.split('.').pop().toLowerCase();
                if (fileExtension == 'jpeg' || fileExtension == 'jpg' || fileExtension == 'png') {
                    assetManager.loadRemote<ImageAsset>(userData.photo_url, function(err, imageAsset) {
                        const spriteFrame = new SpriteFrame();
                        const texture = new Texture2D();
                        texture.image = imageAsset;
                        spriteFrame.texture = texture;
                        this.iconSprite.spriteFrame = spriteFrame;
                    });
                }
            }
        }
    }

}

