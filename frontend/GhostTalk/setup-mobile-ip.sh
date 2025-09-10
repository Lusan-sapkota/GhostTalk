#!/bin/bash

echo "🔍 Finding your local IP address..."
echo ""

# Get the local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not determine local IP address"
    echo "Please check your network connection and try again"
    exit 1
fi

echo "✅ Your local IP address is: $LOCAL_IP"
echo ""

# Check if .env file exists
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating .env file..."
    touch "$ENV_FILE"
fi

# Update or add the EXPO_PUBLIC_BACKEND_IP variable
if grep -q "^EXPO_PUBLIC_BACKEND_IP=" "$ENV_FILE"; then
    # Update existing line
    sed -i "s/^EXPO_PUBLIC_BACKEND_IP=.*/EXPO_PUBLIC_BACKEND_IP=$LOCAL_IP/" "$ENV_FILE"
    echo "🔄 Updated EXPO_PUBLIC_BACKEND_IP in .env file"
else
    # Add new line
    echo "EXPO_PUBLIC_BACKEND_IP=$LOCAL_IP" >> "$ENV_FILE"
    echo "➕ Added EXPO_PUBLIC_BACKEND_IP to .env file"
fi

echo ""
echo "🎉 Configuration complete!"
echo "Your .env file now contains:"
echo "EXPO_PUBLIC_BACKEND_IP=$LOCAL_IP"
echo ""
echo "📱 You can now run your Expo app on your Android device"
echo "Make sure your Django server is running with: python manage.py runserver 0.0.0.0:8000"
echo ""
echo "🔗 Test the connection:"
echo "curl -X GET \"http://$LOCAL_IP:8000/user/check-username/?username=test\""
