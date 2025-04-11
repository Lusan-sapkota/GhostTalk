def get_location_from_ip(ip_address):
    """Get location information from IP address"""
    if not ip_address or ip_address == 'Unknown' or ip_address.startswith('127.0.0.1') or ip_address == '::1':
        return "Local Network"
        
    try:
        # Simple built-in approach first (no external APIs)
        if ip_address.startswith('192.168.') or ip_address.startswith('10.') or ip_address.startswith('172.'):
            return "Local Network"
            
        # For production, use a real IP geolocation service:
        # This is a placeholder for a real implementation
        import socket
        
        # Simple country determination based on IP ranges (very basic)
        # In production, use a proper IP geolocation API/database
        try:
            hostname = socket.gethostbyaddr(ip_address)[0]
            country_code = hostname.split('.')[-1]
            
            country_map = {
                'us': 'United States',
                'uk': 'United Kingdom',
                'ca': 'Canada',
                'au': 'Australia',
                'in': 'India',
                'de': 'Germany',
                'fr': 'France',
                'jp': 'Japan',
                'cn': 'China',
                'ru': 'Russia',
                'br': 'Brazil',
                'np': 'Nepal'
                # Add more as needed
            }
            
            return country_map.get(country_code.lower(), "Unknown location")
        except:
            # Fallback to an estimate based on first octet
            first_octet = int(ip_address.split('.')[0])
            if first_octet < 50:
                return "United States"
            elif first_octet < 100:
                return "Europe"
            elif first_octet < 150:
                return "Asia Pacific"
            elif first_octet < 200:
                return "South America"
            else:
                return "Global"
    except Exception as e:
        print(f"Error determining location from IP: {str(e)}")
        return "Unknown location"