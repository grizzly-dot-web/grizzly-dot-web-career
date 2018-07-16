import Router from "./Router";
import CmsControlledComponent, { CmsState, CmsProps } from "./CmsControlledComponent";
import CmsRoutingComponent from "./Router/AbstractRoutingComponent";
import User from "./Models/User";
import { resolve } from "dns";

export default class CmsComponentHandler {
    static _instance : CmsComponentHandler;
    
    private _user : Promise<User>|undefined

    get currentUser() {
        if (this._user) {
            return this._user; 
        }

        this._user = new Promise((resolve, reject) => {
            fetch('/users/current', {
                method: 'GET',
                credentials: 'same-origin',
              }).then((response : Response) => {
                return response.json().then((data) => {
                    resolve(data as User);
                });
            });
        });

        return this._user; 
    };

    static getInstance() {
        if (!CmsComponentHandler._instance) {
            CmsComponentHandler._instance = new this();
        }

        return CmsComponentHandler._instance;
    }

    public appElement : HTMLElement|null;

    private _router : Router|null
    private _components : CmsControlledComponent<CmsProps<any>, CmsState>[]

    private constructor() {
        this.appElement = null;

        this._router = null;
        this._components = [];
    }


    public init(): any {
        if (!(this.appElement instanceof HTMLElement)) {
            throw new Error('App Element is not assigned')
        }

        this._router = new Router(this.appElement);
    }

    public startRouter() {
        if (!this._router) {
            throw new Error('Router is not assigned')
        }

        console.log(this.currentUser.then((user) => {
            console.log(user);
        }));
        this._router.setupAnchorTagClickHandling();
        this._router.activateComponentByUrl();
    }

	public activateComponentByItsCondition(): any {
        if (!this._router) {
            throw new Error('Router is not assigned')
        }

        this._router.activateComponentByItsCondition();
	}

    public disableComponentConditionRouting() {
        if (!this._router) {
            throw new Error('Router is not assigned')
        }

        this._router.componentCoditionRoutingIsEnabled = false;
    }

    public enableComponentConditionRouting() {
        if (!this._router) {
            throw new Error('Router is not assigned')
        }

        this._router.componentCoditionRoutingIsEnabled = true;
    }
    
    public addComponent(comp: any, isRoutingComponent = false) {
        this._components.push(comp);

        if (this._router && isRoutingComponent) {
            this._router.addComponent(comp as CmsRoutingComponent<CmsProps<any>, CmsState>);
        }
    }
}