export class WatchDog {
    lastTime: number;
    private doTimeout!: () => void;
    timeout: Promise<void>;
    hasTimeout = false;

    constructor(public timeoutTime: number) {
        this.lastTime = Date.now();
        this.timeout = new Promise(resolve => this.doTimeout = resolve);
        this.check();
    }

    check() {
        let leftTime = this.timeoutTime - (Date.now() - this.lastTime);
        if (leftTime < 0) {
            this.hasTimeout = true;
            this.doTimeout();
            return;
        }
        setTimeout(this.check.bind(this), leftTime);
    }

    food() {
        this.lastTime = Date.now();
    }

    toJson() {
        return this.lastTime + this.timeoutTime;
    }
}