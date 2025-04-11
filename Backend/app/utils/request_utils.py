from flask import request

def get_client_ip():
    """
    Get the real client IP address from request headers
    
    Examines various headers in priority order to find the true client IP:
    - X-Forwarded-For: Standard proxy header with client's original IP
    - X-Real-IP: Used by nginx and some other proxies
    - CF-Connecting-IP: Cloudflare-specific header
    - Falls back to request.remote_addr as last resort
    
    Returns:
        str: The client's real IP address
    """
    headers_to_check = [
        'X-Forwarded-For',  # Standard proxy header
        'X-Real-IP',        # Common with nginx
        'CF-Connecting-IP', # Cloudflare
        'True-Client-IP'    # Akamai and others
    ]
    
    # Check headers in priority order
    for header in headers_to_check:
        if header in request.headers:
            # X-Forwarded-For may contain multiple IPs - use the first one
            if header == 'X-Forwarded-For':
                ips = request.headers.get(header).split(',')
                client_ip = ips[0].strip()
                print(f"[IP DETECTION] Found client IP {client_ip} in {header} header")
                return client_ip
            else:
                client_ip = request.headers.get(header)
                print(f"[IP DETECTION] Found client IP {client_ip} in {header} header")
                return client_ip
    
    # Fall back to remote_addr if no proxy headers found
    client_ip = request.remote_addr
    print(f"[IP DETECTION] Using fallback remote_addr: {client_ip}")
    
    # For development environments, use a fallback IP for testing when we detect localhost
    if client_ip in ('127.0.0.1', 'localhost', '::1'):
        test_ip = request.headers.get('X-Test-IP')
        if test_ip:
            print(f"[IP DETECTION] Development mode: using test IP {test_ip}")
            return test_ip
        
    return client_ip