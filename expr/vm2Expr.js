const {VM, VMScript, NodeVM} = require("vm2")
const fs = require("fs");
const path = require("path");

const sandbox = {
    log: console.log
}

const vm = new NodeVM({
    sandbox,
    timeout: 1000
})

const service = vm.run(`while(true){}
module.exports = {
    hello(name) {
        while(true){}
        log("hello " + name)
    }
}`)

service.hello("world!")
console.log("test")
