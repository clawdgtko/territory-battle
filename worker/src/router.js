// Simple Router pour Cloudflare Worker

export class Router {
  constructor() {
    this.routes = {
      GET: [],
      POST: [],
      PUT: [],
      DELETE: []
    };
  }

  get(path, handler) {
    this.routes.GET.push({ path, handler, pattern: this._createPattern(path) });
  }

  post(path, handler) {
    this.routes.POST.push({ path, handler, pattern: this._createPattern(path) });
  }

  put(path, handler) {
    this.routes.PUT.push({ path, handler, pattern: this._createPattern(path) });
  }

  delete(path, handler) {
    this.routes.DELETE.push({ path, handler, pattern: this._createPattern(path) });
  }

  _createPattern(path) {
    // Convertir /api/player/:pseudo en regex
    const paramNames = [];
    const regexPath = path.replace(/:([^/]+)/g, (match, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });
    
    return {
      regex: new RegExp(`^${regexPath}$`),
      paramNames
    };
  }

  async handle(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    const routes = this.routes[method] || [];

    for (const route of routes) {
      const match = pathname.match(route.pattern.regex);
      if (match) {
        // Extraire les paramètres
        const params = {};
        route.pattern.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        // Ajouter params à la requête
        request.params = params;

        return await route.handler(request, env);
      }
    }

    // 404
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Not found',
      path: pathname 
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
