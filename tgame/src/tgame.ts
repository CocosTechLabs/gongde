import { GameFi, Address, TonClient4 } from "@ton/phaser-sdk";
export class TGameSDK {
    public async init() {
        console.log(GameFi)
        const gameFi = await GameFi.create()
        console.log(gameFi)
    }

}