from django.http import HttpResponseForbidden

class IPWhitelistMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/admin/'):
            try:
                from .admin_models import SystemConfiguration
                config = SystemConfiguration.get_solo()
                whitelist = [ip.strip() for ip in config.admin_ip_whitelist.split(',') if ip.strip()]
                
                if whitelist:
                    client_ip = self.get_client_ip(request)
                    if client_ip not in whitelist:
                        return HttpResponseForbidden("Access Denied: IP not whitelisted")
            except Exception:
                # During migrations or if table doesn't exist, skip IP check
                pass

        return self.get_response(request)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
