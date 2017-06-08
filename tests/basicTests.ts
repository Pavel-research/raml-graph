"use strict";
import chai = require("chai");
import  mocha=require("mocha")
import rp=require("raml-1-parser");
import json=require("json2raml-loader");
let assert = chai.assert;
import path=require("path")
import fs=require("fs")

function loadApi(name: string) {
    var rs = <rp.api10.Api>rp.loadRAMLSync(path.resolve(__dirname, "../../tests/raml/" + name + ".raml"), []);
    var s = rs.expand(true).toJSON({serializeMetadata: false});
    var result = json.loadApi(s);
    return result;
}
function loadLibrary(name: string) {
    var rs = <rp.api10.Api>rp.loadRAMLSync(path.resolve(__dirname, "../../tests/raml/" + name + ".raml"), []);
    var s = rs.toJSON({serializeMetadata: false});
    var result = json.loadLibrary(s);
    return result;
}

describe("structure tests", function () {
    it("test0", function () {
        var l = loadApi("test1");

    })
})
