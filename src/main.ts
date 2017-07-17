import views=require("callables-rpc-views")
import domain=require("raml1-domain-model")
import shapes=require("raml-typesystem-shapes")
import scopes=require("raml-typesystem-scopes")
import collections=require("raml-typesystem-collections")
import {CallableFunction, Module} from "callables-rpc-views";

export interface Entity {

    name(): string

    rootRepresentaton(): domain.Type

    properties(): domain.Property[]

    methods(): views.CallableFunction[];

}

export interface HasResources{

    entity(): Entity;

    resources(): ResourceModel[]

    memberCollections(): CollectionModel[]

    actions(): CallableFunction[]

    parent(): ResourceModel
}

export interface ResourceModel extends HasResources{

    self(): MemberFunction

    remove(): MemberFunction

    update(): MemberFunction

    patch(): MemberFunction
}

export interface CollectionModel extends HasResources{

    list(): collections.Collection

    add(): CallableFunction

    item(): ResourceModel
}








export class EntityImpl implements Entity {

    _methods: MemberFunction[] = []


    constructor(private root: domain.Type, private m: ObjectModule) {

    }

    toDebugJSON() {
        return this._methods.map(x => x.toString());
    }

    rootRepresentaton() {
        return this.root;
    }

    name() {
        return this.root.name();
    }

    properties() {
        return this.root.properties();
    }

    methods() {
        return [].concat(this._methods);
    }

    topLevelCollections() {

    }

    isRelated(n: views.CallableFunction): boolean {
        var res = false;
        n.parameters().forEach(x => {
            if (canCompute(x.type(), this.root)) {
                res = true;
            }
        })
        return res;
    }

    toMethod(n: views.CallableFunction): CallableFunction {
        return new MemberFunction(this, n, this.m);
    }
}
interface ParameterComputation {
    sourcePar: string
    targetPar: string
    func: (x: any) => any
}
export class MemberFunction implements CallableFunction {

    _par: views.Parameter[] = [];

    _computation: {[name: string]: (x: any) => any} = {};

    private _computationFromParameters: ParameterComputation[] = [];

    _pack: MemberFunction[] = [];

    getAliasGroup(): MemberFunction[] {
        return this._pack
    }

    getEntity() {
        return this.owner;
    }

    toString() {
        return this.id() + "(" + this.parameters().map(x => x.name()) + ")"
    }

    constructor(private owner: EntityImpl, private func: CallableFunction, private m: Module) {

        this._par.push({
            name(){
                return "this"
            },
            required(){
                return true
            },
            type(){
                return owner.rootRepresentaton()
            },
            location(){
                return "owner"
            },
            annotations(){
                return owner.rootRepresentaton().annotations()
            },
            annotation(n: string){
                return owner.rootRepresentaton().annotation(n)
            }
        })
        var ps: views.Parameter[] = [];
        func.parameters().forEach(x => {
            if (canCompute(x.type(), this.owner.rootRepresentaton())) {
                this._computation[x.name()] = computeFunction(x.type(), this.owner.rootRepresentaton());
            }
            else {
                ps.push(x);
            }
        })
        ps.forEach(x => {
            var computable = false;
            ps.forEach(y => {
                if (y != x) {
                    if (canCompute(x.type(), y.type())) {
                        var ps = computeFunction(x.type(), y.type());
                        this._computationFromParameters.push({
                            sourcePar: y.name(),
                            targetPar: x.name(),
                            func: ps
                        })
                        computable = true;
                    }
                }
            })
            if (!computable) {
                this._par.push(x);
            }
        })
    }

    id() {
        return this.func.id();
    }

    displayName() {
        return this.func.displayName();
    }

    returnType() {
        return this.func.returnType();
    }

    annotation(n: string) {
        return this.func.annotation(n)
    }

    hasAnnotation(n: string) {
        return this.func.hasAnnotation(n);
    }

    call(v: any): Promise<any> {
        return this.func.call(this.updateParameters(v));
    }

    validateParameters(v: any) {
        var np = this.updateParameters(v);
        return this.func.validateParameters(np);
    }

    private updateParameters(v: any): any {
        var np = JSON.parse(JSON.stringify(v));
        var self = v["this"];
        delete np["this"];
        this.fillParameters(np, self, v);
        return np;
    }

    fillParameters(pars: {[name: string]: any}, thisObj: any, v: any) {
        this.func.parameters().forEach(x => {
            let s = x.name();
            if (this._computation[s]) {
                pars[s] = this._computation[s](thisObj);
            }
        })
        this._computationFromParameters.forEach(x => {
            var ds = v[x.sourcePar];
            pars[x.targetPar] = x.func(ds);
        })
    }

    module() {
        return this.m;
    }

    isSafe() {
        return this.func.isSafe();
    }

    securedBy() {
        return this.func.securedBy();
    }

    annotations() {
        return this.func.annotations();
    }

    parameters() {
        return this._par;
    }
}
function computeFunction(t1: domain.Type, t2: domain.Type): (x: any) => any {
    if (shapes.isShapeOf(t1, t2)) {
        return shapes.transformFunc(t2, t1);
    }
    var func: (x: any) => any = null;
    t2.properties().forEach(x => {
        if (canCompute(x.range(), t1)) {
            var cf = computeFunction(x.range(), t1);
            var nm = x.name()
            func = (v => {
                var fld = v[nm];
                return cf(nm);
            })
        }
    });
    return null;
}
function canCompute(t1: domain.Type, t2: domain.Type): boolean {
    t1 = shapes.domainWithRefs(t1);
    //t2 = shapes.domainWithRefs(t2);
    if (t1.isBuiltin() && t2.isBuiltin()) {
        return false;
    }
    if (t1.isArray() && t2.isArray()) {
        return false;
    }
    if (t1 == t2) {
        return true;
    }

    var res = false;
    var count = 0;
    if (t1.isObject() && t2.isObject()) {
        t2.properties().forEach(x => {
            if (canCompute(x.range(), t1)) {
                res = true;
                count++;
            }
        });
    }
    return res && count == 1;
}

export interface ObjectModule extends views.Module {

    entities(): Entity[];
}


export function buildEntityList(_original: views.Module) {
    var candidates: Set<domain.Type> = new Set();
    _original.functions().forEach(x => {
        var rt = x.returnType();
        if (rt) {
            var collection = collections.toCollection(x);
            if (collection) {
                rt = collection.range();
            }
            rt = shapes.domainWithRefs(rt);
            if (rt.isObject()) {
                candidates.add(rt);
            }
        }
    })
    //now we have a list of candidates
    //let's collapse shapes
    var allList = Array.from(candidates);
    return allList;
}

export class ObjectModuleImpl implements ObjectModule {

    toDebugJSON() {
        var cls: any = {};
        this._entityClasses.forEach(c => cls[c.name()] = c.toDebugJSON());
        return {
            globals: this._functions.map(x => x.id() + "(" + x.parameters().map(y => y.name()).join(",") + ")"),
            classes: cls
        }
    }

    constructor(private  _original: views.Module) {
        var entities: EntityImpl[] = buildEntityList(_original).map(x => new EntityImpl(x, this));
        var _globals: views.CallableFunction[] = [];
        _original.functions().forEach(f => {
            var consumed = false;
            var memberOf: MemberFunction[] = [];
            entities.forEach(v => {
                if (v.isRelated(f)) {
                    consumed = true;
                    var memb = new MemberFunction(v, f, this);
                    memb._pack = memberOf;
                    v._methods.push(memb);
                    memberOf.push(memb);
                }
            });
            if (!consumed) {
                _globals.push(f);
            }
        })
        this._functions = _globals;
        this._entityClasses = entities;
    }

    private _functions: views.CallableFunction[]
    private _entityClasses: EntityImpl[] = [];

    title(): string {
        return this._original.title();
    }

    functions(): views.CallableFunction[] {
        return this._functions;
    }

    annotations(): views.Annotation[] {
        return this._original.annotations();
    }

    securitySchemas(): domain.SecuritySchemeDefinition[] {
        return this._original.securitySchemas();
    }

    settings(): any {
        return this._original.settings();
    }

    entities() {
        return this._entityClasses;
    }
}

export function toObjectModule(module: views.Module) {
    return new ObjectModuleImpl(module);
}