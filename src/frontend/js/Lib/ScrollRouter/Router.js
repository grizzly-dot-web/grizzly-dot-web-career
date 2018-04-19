import Module from'./Module';
import Route from'./Route';

class Router {

	get options() {
		return this._options;
	}
	set options(object) {
		if(object){ 
			Object.assign(this._options, object);
		}
	}

	constructor(options) {
		this._pageModule = null;
		this._currentRoute = null;
		this._dispatchCalled = false;

		this.dispatchingTimeout = null;
		this._options = Object.assign({
			duration: null, // the duration in milliseconds when durationPerRouteDepth is not defined
			routingBehaviour: null, // function called for each path part when routingBehaviourPerRouteDepth is not defined
			durationPerRouteDepth: [],
			routingBehaviourPerRouteDepth: [],
		}, options);

		this._pageModule = this._registerModules();
		console.log('PAGE Module:', this._pageModule);
	}

	getNextRoute() {
		return this._getRouteByRelativeIndex(1);
	}

	getPreviousRoute() {
		return this._getRouteByRelativeIndex(-1);
	}

	_getRouteByRelativeIndex(wantedIndex) {
		return this.workWithCurrentRoute().then(
			(currentRoute) => {			
				console.log('Current Route', currentRoute);	
				let depth = currentRoute.modules.length;
				let currentPart = currentRoute.modules[depth -1];

				let modules = this._pageModule.children;
				if (depth > 1 && currentPart.parent) {
					modules = currentPart.parent.children;
				}
			
				let keys = Object.keys(modules);
				let key = currentPart.slug;
				let i = keys.indexOf(key) + wantedIndex;
			
				let destinationModule = undefined;
				if (i !== -1 && keys[i] && modules[keys[i]]) {
					destinationModule = modules[keys[i]];
				}

				if (!(destinationModule instanceof Module)) {
					return null;
				}
				
				let routeModules = currentRoute.modules.slice(0, currentRoute.modules.length-1);
				routeModules.push(destinationModule);

				let routeToDispatch = new Route(routeModules);

				return routeToDispatch;
			}
		);
	}

	getRouteByPath(pathname) {
		let preparedPath = pathname;
		if (pathname.charAt(0) == '/') {
			preparedPath = preparedPath.substr(1);
		}
		if (pathname.charAt(pathname.length -1) == '/') {
			preparedPath = preparedPath.substr(pathname.length -1, 1);
		}
		
		let routeSlugs = preparedPath.split('/');

		let modules = [];
		let module = this._pageModule;
		for (let depth = 0; depth < routeSlugs.length; depth++) {
			let slug = routeSlugs[depth];

			if (module.slug !== slug && module.children) {
				module = module.children[slug];
			}

			if (!module) {
				throw new Error(`404 path did not exist: "${pathname}" could not match: "${slug}"`);
			}

			modules.push(module);
		}
		
		return this._forceRouteToHaveDeepestChildPath(new Route(modules));
	}

	_forceRouteToHaveDeepestChildPath(route, returnLastChild) {
		let lastModule = route.modules[route.modules.length -1];
		while (lastModule) {
			lastModule = lastModule.children[Object.keys(lastModule.children)[0]];
			
			if (lastModule) {
				route.addPart(lastModule);
			}
		}

		return route;
	}

	goto(route, then) {
		let routeToDispatch = route;
		if (!(route instanceof Route)) {
			routeToDispatch = this.getRouteByPath(route);
		}

		let state = {};

		return this.dispatch(routeToDispatch).then((route) => {
			window.history.replaceState(state, route.modules[route.modules.length -1], route.pathname);
			then.resolve(route);
		}, then.reject);
	}

	dispatch(route) {
		this._dispatchCalled = true;

		if (!route) {
			throw new Error('no route or path specified');
		}

		let routeToDispatch = route;
		if (!(route instanceof Route)) {
			routeToDispatch = this.getRouteByPath(route);
		}
		if (route === null) {
			return new Promise((resolve, reject) => {
				this.dispatchingTimeout = setTimeout(() => {
					callback(null, '', 0);
					return resolve(routeToDispatch);
				}, duration);
			});
		}

		if (this.dispatchingTimeout != null) {
			return new Promise((resolve, reject) => {
				return reject(routeToDispatch);
			});
		}

		let successfull = true;

		let callback = this.options.routingBehaviourPerRouteDepth[0];
		if (!callback) {
			callback = this.options.routingBehaviour;
		}

		let duration = this.options.durationPerRouteDepth[0];
		if (!duration) {
			duration = this.options.duration;
		}

		let module = null;
		return new Promise((resolve, reject) => {
			for (let depth = 0; depth < routeToDispatch.modules.length; depth++) {
				module = routeToDispatch.modules[depth];
				if (this.options.durationPerRouteDepth[depth]) {
					duration = this.options.durationPerRouteDepth[depth];
				}
	
				if (this.options.routingBehaviourPerRouteDepth[depth]) {
					callback = this.options.routingBehaviourPerRouteDepth[depth];
				}

				if (!(module instanceof Module)) {
					throw new Error('404 no matching root');
				}
				
				if (successfull) {
					if (!(this._currentRoute instanceof Route)) {
						this._currentRoute = new Route();
					}
					
					this._currentRoute.addPart(module);
				}

				this.dispatchingTimeout = setTimeout(() =>  {
					module.dispatch(callback, depth, routeToDispatch.modules.length);

					if (depth >= routeToDispatch.modules.length -1) {
						clearTimeout(this.dispatchingTimeout);
						this.dispatchingTimeout = null;

						return successfull ? resolve(routeToDispatch) : reject(routeToDispatch);
					}

					this._currentRoute = routeToDispatch;
				}, duration);
			}
		});
	}

	workWithCurrentRoute() {
		if (this._currentRoute instanceof Route) {
			return new Promise((resolve, reject) => {
				return resolve(this._currentRoute);
			});
		}

		if (this._dispatchCalled !== true) {
			throw new Error('you have to call dispatch once before accessing the current route');
		}

		return new Promise((resolve, reject) => {
			let timeout = null;
			
			while(this._currentRoute != null) {
				if (timeout != null) {
					return resolve(this._currentRoute);
				}
			}
		});
	}

	_registerModules() {
		let deepestRouteCount = 10;
		let deppestNestedModuleElements = [];

		for(var queryMultiplier = deepestRouteCount; queryMultiplier > 0; queryMultiplier--) {
			let query = Array.apply(null, {length: queryMultiplier}).map(() => { return '[data-gzly-routing-module]';}).join(' ');

			for (let element of document.querySelectorAll(query)) {
				// if HTMLElement has no data-route attribute with a value 
				if (element.getAttribute('data-gzly-routing-module') === null || element.getAttribute('data-gzly-routing-module').length < 0) {
					continue;
				}
		
				if (deppestNestedModuleElements.includes(element)) {
					continue;
				}
				
				let childrenOfElementAreInDeepestNested = false;
				for (let childElements of element.children) {
					if (deppestNestedModuleElements.includes(childElements)) {
						childrenOfElementAreInDeepestNested = true;
					}
				} 
		
				if (childrenOfElementAreInDeepestNested) {
					continue;
				}

				deppestNestedModuleElements.push(element);
			}
		}

		let convertToModules = (elements, object) => {
			if (!object) {
				object = {};
			}
			for (let element of elements) {

				let parent = element.parentElement;
				while((parent.getAttribute('data-gzly-routing-module') === null || parent.getAttribute('data-gzly-routing-module').length < 0)) {
					parent = parent.parentElement;
				}

				if (!object[parent.getAttribute('data-gzly-routing-module')]) {
					object[parent.getAttribute('data-gzly-routing-module')] = new Module(parent);
				}

				if (!object[parent.getAttribute('data-gzly-routing-module')].children[element.getAttribute('data-gzly-routing-module')]) {
					object[parent.getAttribute('data-gzly-routing-module')].children[element.getAttribute('data-gzly-routing-module')] = new Module(element);
				}
				object[parent.getAttribute('data-gzly-routing-module')].children[element.getAttribute('data-gzly-routing-module')].parent = object[parent.getAttribute('data-gzly-routing-module')];

				if (parent.parent != null) {
					return convertToModules(parent, object);
				}

			}

			return object;
		};

		return new Module('', document.body, null, convertToModules(deppestNestedModuleElements));
	}
}

export default Router;