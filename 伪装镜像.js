const upstream = 'raw.githubusercontent.com';
const upstream_mobile = 'raw.githubusercontent.com';
const blocked_region = ['RU'];
const blocked_ip_address = ['0.0.0.0', '127.0.0.1'];

addEventListener('fetch', event => {
    event.respondWith(fetchAndApply(event.request));
});

async function fetchAndApply(request) {
    const region = request.headers.get('cf-ipcountry').toUpperCase();
    const ip_address = request.headers.get('cf-connecting-ip');
    const user_agent = request.headers.get('user-agent');

    let url = new URL(request.url);

    if (url.protocol === 'http:') {
        url.protocol = 'https:';
        return Response.redirect(url.href);
    }

    if (blocked_region.includes(region)) {
        return new Response('Access denied: WorkersProxy is not available in your region yet.', {
            status: 403
        });
    }

    if (blocked_ip_address.includes(ip_address)) {
        return new Response('Access denied: Your IP address is blocked by WorkersProxy.', {
            status: 403
        });
    }

    const upstream_domain = await device_status(user_agent) ? upstream : upstream_mobile;
    url.host = upstream_domain;

    const new_request_headers = new Headers(request.headers);
    new_request_headers.set('Host', upstream_domain);
    new_request_headers.set('Referer', url.href);

    const original_response = await fetch(url.href, {
        method: request.method,
        headers: new_request_headers
    });

    const content_type = original_response.headers.get('content-type');
    let response_body;

    // 只替换HTML页面内容，其它类型内容保持不变
    if (content_type && content_type.includes('text/html')) {
        response_body = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Welcome to nginx!</title>
            <style>
                body {
                    width: 35em;
                    margin: 0 auto;
                    font-family: Tahoma, Verdana, Arial, sans-serif;
                }
            </style>
        </head>
        <body>
        <h1>Welcome to nginx!</h1>
        <p>If you see this page, the nginx web server is successfully installed and working. Further configuration is required.</p>
        <p>For online documentation and support please refer to <a href="http://nginx.org/">nginx.org</a>.<br/>
        Commercial support is available at <a href="http://nginx.com/">nginx.com</a>.</p>
        <p><em>Thank you for using nginx.</em></p>
        </body>
        </html>`;
    } else {
        response_body = original_response.body; // 非HTML内容不做修改
    }

    const new_response_headers = new Headers(original_response.headers);
    new_response_headers.set('access-control-allow-origin', '*');
    new_response_headers.set('access-control-allow-credentials', 'true');

    return new Response(response_body, {
        status: original_response.status,
        headers: new_response_headers
    });
}

async function device_status(user_agent_info) {
    const agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
    return !agents.some(agent => user_agent_info.includes(agent));
}
