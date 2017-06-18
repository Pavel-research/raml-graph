import views=require("callables-rpc-views")
import domain=require("raml1-domain-model")
import shapes=require("raml-typesystem-shapes")
import scopes=require("raml-typesystem-scopes")

export interface EntityClass {

    rootRepresentaton(): domain.Type

    displayName(): string

    properties(): domain.Property[]

    methods(): views.CallableFunction[];
}

export interface ObjectModule extends views.Module {

    entityClasses(): EntityClass[];
}
function canCompute(t1:domain.Type, t2:domain.Type): boolean {
    if (t1.isObject()&&t2.isObject()){
        t1.properties().forEach(x=>{
            if (x.range()==t2){

            }
        });
    }
    return false;
}

export class ObjectModuleImpl implements ObjectModule {

    constructor(private  _original: views.Module) {

        _original.functions().forEach(x => {
            var candidateTypes = new Set<domain.Type>()
            x.parameters().forEach(p => {
                if (!p.type().isBuiltin()) {
                    var dt = shapes.domainType(p.type());
                    candidateTypes.add(dt);
                }
            })
            //remove computable types
            var removed = true;
            var mm = Array.from(candidateTypes);
            while (removed) {
                removed = false;
                mm.forEach(t1 => {
                    mm.forEach(t2 => {
                        if (t1 != t2) {
                            if (canCompute(t1, t2)) {
                                mm = mm.filter(x => x != t1);
                                removed = true;
                            }
                        }
                    })
                })
            }
            candidateTypes.forEach(x=>{

            })
        })
    }

    private _functions: views.CallableFunction[]
    private _entityClasses: EntityClass[] = [];

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

    entityClasses() {
        return this._entityClasses;
    }
}

export function toObjectModule(module: views.Module) {
    return new ObjectModuleImpl(module);
}