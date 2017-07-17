"use strict";
import chai = require("chai");
import  mocha=require("mocha")
import rp=require("raml-1-parser");
import json=require("json2raml-loader");
let assert = chai.assert;
import path=require("path")
import fs=require("fs")
import gr=require("../src/main")
import crpc=require("callables-rpc-views")

function loadApi(name: string) {
    var rs = <rp.api10.Api>rp.loadRAMLSync(path.resolve(__dirname, "../../tests/raml/" + name + ".raml"), []);
    var s = rs.expand(true).toJSON({serializeMetadata: false});
    var result = json.loadApi(s);
    return result;
}
function toGraph(name: string) {
    return gr.toObjectModule(crpc.module(loadApi(name)));
}
function toModule(name: string) {
    return crpc.module(loadApi(name));
}
function loadLibrary(name: string) {
    var rs = <rp.api10.Api>rp.loadRAMLSync(path.resolve(__dirname, "../../tests/raml/" + name + ".raml"), []);
    var s = rs.toJSON({serializeMetadata: false});
    var result = json.loadLibrary(s);
    return result;
}

describe("structure tests", function () {
    it("test0", function () {
        var g = toModule("test1");
        var el = gr.buildEntityList(g);
        assert(el[0].name() == "Repository")
    })
    it("test1", function () {
        var g = toModule("test2");
        var el = gr.buildEntityList(g);
        assert(el.length == 1);
        assert(el[0].name() == "Repository")
    })
    it("test2", function () {
        var g = toModule("test3");
        var el = gr.buildEntityList(g);
        assert(el.length == 1);
        assert(el[0].name() == "Repository")
    })
    it("test3", function () {
        var g = toModule("test4");
        var el = gr.buildEntityList(g);
        assert(el.length == 1);
        assert(el[0].name() == "Repository")

        let re = new gr.EntityImpl(el[0], null);
        g.functions().forEach(v => {
            if (v.id() == 'repositories.{id}.get') {
                assert(re.isRelated(v));
            }
            else {
                assert(!re.isRelated(v));
            }
        })
    })
    it("test4", function () {
        var g = toModule("test5");
        var el = gr.buildEntityList(g);
        assert(el.length == 1);
        assert(el[0].name() == "Repository")
        let re = new gr.EntityImpl(el[0], null);
        g.functions().forEach(v => {
            if (v.id() == 'repositories.orgs.{orgId}.{id}.get') {
                var fnc = new gr.MemberFunction(re, v, null);
                var prms = fnc.parameters();
                var pr = prms.map(x => x.name()).join(",");
                assert(pr == "this");
                assert(re.isRelated(v));
            }
            else {
                assert(!re.isRelated(v));
            }
        })
    })
    it("test5", function () {
        var g = toModule("test6");
        var el = gr.buildEntityList(g);
        assert(el.length == 1);
        assert(el[0].name() == "Repository")

        let re = new gr.EntityImpl(el[0], null);
        g.functions().forEach(v => {
            var fnc = new gr.MemberFunction(re, v, null);
            var prms = fnc.parameters();
            assert(prms.map(x => x.name()).join(",") == "this");
        })
    })
    it("test6", function () {
        var g = toGraph("test8");
        var json = g.toDebugJSON();
        assert.deepEqual(json, {
            "classes": {
                "Organization": [
                    "repositories.orgs.{orgId}.get(this)",
                    "repositories.orgs.{orgId}.repo.{repoId}.get(this,repoId)"
                ],
                "Repository": [
                    "repositories.orgs.{orgId}.get(this)",
                    "repositories.orgs.{orgId}.repo.{repoId}.get(this)"
                ]
            },
            "globals": []
        })
    })
    it("test7", function () {
        var g = toGraph("test9");
        var json = g.toDebugJSON();
        assert.deepEqual(json, { globals: [ 'repositories.orgs.get()' ],
            classes:
                { Organization:
                    [ 'repositories.orgs.{orgId}.get(this)',
                        'repositories.orgs.{orgId}.repo.get(this)',
                        'repositories.orgs.{orgId}.repo.post(this,body)',
                        'repositories.orgs.{orgId}.repo.{repoId}.put(this,body)',
                        'repositories.orgs.{orgId}.repo.{repoId}.delete(this,repoId)',
                        'repositories.orgs.{orgId}.repo.{repoId}.get(this,repoId)' ],
                    Repository:
                        [ 'repositories.orgs.{orgId}.get(this)',
                            'repositories.orgs.{orgId}.repo.get(this)',
                            'repositories.orgs.{orgId}.repo.post(this)',
                            'repositories.orgs.{orgId}.repo.{repoId}.put(this)',
                            'repositories.orgs.{orgId}.repo.{repoId}.delete(this)',
                            'repositories.orgs.{orgId}.repo.{repoId}.get(this)' ] } })
    })
    it("test8", function () {
        var g = toGraph("test9");
        var json = g.toDebugJSON();
        assert.deepEqual(json,{ globals: [ 'repositories.orgs.get()' ],
            classes:
                { Organization:
                    [ 'repositories.orgs.{orgId}.get(this)',
                        'repositories.orgs.{orgId}.repo.get(this)',
                        'repositories.orgs.{orgId}.repo.post(this,body)',
                        'repositories.orgs.{orgId}.repo.{repoId}.put(this,body)',
                        'repositories.orgs.{orgId}.repo.{repoId}.delete(this,repoId)',
                        'repositories.orgs.{orgId}.repo.{repoId}.get(this,repoId)' ],
                    Repository:
                        [ 'repositories.orgs.{orgId}.get(this)',
                            'repositories.orgs.{orgId}.repo.get(this)',
                            'repositories.orgs.{orgId}.repo.post(this)',
                            'repositories.orgs.{orgId}.repo.{repoId}.put(this)',
                            'repositories.orgs.{orgId}.repo.{repoId}.delete(this)',
                            'repositories.orgs.{orgId}.repo.{repoId}.get(this)' ] } })
    })
    it("test9", function () {
        var g = toGraph("test11");
        var json = g.toDebugJSON();
        assert.deepEqual(json,{ globals: [],
            classes: { Repository: [ 'repositories.orgs.{orgId}.repo.{repoId}.get(this,orgId)' ] } });
    })
})