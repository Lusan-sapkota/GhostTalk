export const debugAuth = async () => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    console.group('Auth Debug Info');
    console.log('Token exists:', !!token);
    if (token) {
      // Safely show part of the token
      console.log('Token preview:', token.substring(0, 15) + '...');
      
      // Try to decode token (JWT)
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        console.log('Token payload:', payload);
        
        // Check expiration
        if (payload.exp) {
          const expiresAt = new Date(payload.exp * 1000);
          console.log('Token expires:', expiresAt);
          console.log('Is expired:', expiresAt < new Date());
        }
      } catch (e) {
        console.log('Not a valid JWT token or error decoding:', e);
      }
    }
    
    // Test API connection
    try {
      const response = await fetch('http://192.168.18.2:5000/api/auth/debug-auth', {
        method: 'GET',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Server debug info:', data);
      } else {
        console.log('Server debug call failed:', response.status);
      }
    } catch (e) {
      console.log('Error connecting to debug endpoint:', e);
    }
    
    console.groupEnd();
  } catch (e) {
    console.error('Error in auth debug:', e);
  }
};

// Add this to window for console access
(window as any).debugAuth = debugAuth;