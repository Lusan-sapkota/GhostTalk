import requests
from flask import current_app
import logging

def get_location_from_ip(ip_address):
    """
    Get location information from an IP address using ip-api.com
    """
    # Don't try to look up local/private IPs
    if not ip_address:
        return "Unknown location"
        
    # Enhanced local IP detection
    local_patterns = ('192.168.', '10.', '172.16.', '172.17.', '172.18.', 
                      '172.19.', '172.20.', '172.21.', '172.22.', '172.23.',
                      '172.24.', '172.25.', '172.26.', '172.27.', '172.28.',
                      '172.29.', '172.30.', '172.31.', '127.', 'localhost', 
                      'unknown', '::1', 'fc00:')
    
    if any(ip_address.startswith(pattern) for pattern in local_patterns):
        print(f"[GEOLOCATION] Detected local/private IP: {ip_address}")
        return "Unknown location"
    
    try:
        # First get coordinates from IP using ip-api (free, no API key required)
        print(f"[GEOLOCATION] Looking up location for IP: {ip_address}")
        response = requests.get(f"http://ip-api.com/json/{ip_address}", timeout=3)
        
        if not response.ok:
            print(f"[GEOLOCATION] IP lookup failed with status {response.status_code}")
            return "Unknown location"
        
        data = response.json()
        if data.get('status') != 'success':
            print(f"[GEOLOCATION] IP lookup returned error: {data.get('message', 'Unknown error')}")
            return "Unknown location"
        
        # Format the location nicely
        city = data.get('city', '')
        region = data.get('regionName', '')
        country = data.get('country', '')
        
        if city and country:
            if region and region != city:
                location = f"{city}, {region}, {country}"
            else:
                location = f"{city}, {country}"
        elif country:
            location = country
        else:
            return "Unknown location"
        
        print(f"[GEOLOCATION] Found location: {location}")
        return location
        
    except Exception as e:
        print(f"[GEOLOCATION] Error looking up location: {str(e)}")
        return "Unknown location"