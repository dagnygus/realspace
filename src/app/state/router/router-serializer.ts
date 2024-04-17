import { RouterStateSnapshot, Params, Route } from "@angular/router";
import { RouterStateSerializer } from "@ngrx/router-store";
import { RouterStateUrl } from "../../models/abstract-models";

export class CustomRouterSerializer implements RouterStateSerializer<RouterStateUrl> {

  private _currentState: RouterStateUrl | null = null;

  serialize(routerState: RouterStateSnapshot): RouterStateUrl {

    if (this._currentState) {
      this._currentState = { ...this._currentState, lastState: null }
    }

    let fullPath = '';
    let params: Params = {};

    let route = routerState.root;
    if (route.routeConfig) {
      fullPath = _concatPaths(fullPath, route.routeConfig);
    }

    const stack = [route]

    while (stack.length > 0) {
      const r = stack.pop()!;
      params = { ...params, ...r.params }
      stack.push(...r.children);
    }

    while (route.firstChild) {
      route = route.firstChild;
      if (route.routeConfig) {
        fullPath = _concatPaths(fullPath, route.routeConfig);
      }
    }

    if (params == null) {
      params = {};
    }

    const {
      url,
      root: { queryParams, fragment },
    } = routerState;

    const currentRouterStateUrl: RouterStateUrl = {
      url,
      params,
      queryParams,
      fragment,
      fullPath,
      lastState: this._currentState
    }

    this._currentState = currentRouterStateUrl;


    return currentRouterStateUrl
  }

}

function _concatPaths(currentPath: string, route: Route): string {
  if (route.path == null || route.path.length === 0) { return currentPath; }


  const endedWithSlash = currentPath.endsWith('/');
  const startedWithSlash = route.path.startsWith('/');

  if (currentPath.length === 0) {
    if (startedWithSlash) {
      return route.path.substring(1);
    }
    return route.path;
  }

  if (!(endedWithSlash || startedWithSlash)) {
    return currentPath + '/' + route.path;
  } else if ((!endedWithSlash && startedWithSlash) || (endedWithSlash && !startedWithSlash)) {
    return currentPath + route.path;
  } else {
    return currentPath.substring(0, currentPath.length - 2) + route.path.substring(1);
  }
}
