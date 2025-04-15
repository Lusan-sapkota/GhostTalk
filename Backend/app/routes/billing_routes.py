from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from ..utils.security import token_required
import logging
from datetime import datetime
import os
from ..services.email_service import EmailService

# Create blueprint
billing_bp = Blueprint('billing', __name__)

@billing_bp.route('/subscription-request', methods=['POST', 'OPTIONS'])
@cross_origin(origins="*", supports_credentials=True, allow_headers=["Content-Type", "Authorization"])
@token_required
def request_subscription(current_user_id):
    """Handle subscription requests"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
    
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            logging.error("No data provided in subscription request")
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Extract data from request
        plan = data.get('plan', '')
        country = data.get('country', '')
        email = data.get('email', '')
        name = data.get('name', '')
        
        # Log the request for debugging
        logging.info(f"Subscription request received: {plan} plan for {name} ({email}) from {country}")
        
        # Generate a unique request ID
        request_id = f"SUB-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Send confirmation email to user
        try:
            email_service = EmailService()
            email_service.send_subscription_confirmation(
                email, 
                name, 
                request_id, 
                plan,
                country
            )
            
            # Also notify billing department with additional details (if any)
            additional_details = {
                "User ID": current_user_id,
                "Source": "Website",
                "Platform": request.user_agent.platform if request.user_agent else "Unknown"
            }
            
            email_service.send_subscription_notification(
                request_id,
                name,
                email,
                plan,
                country,
                additional_details
            )
        except Exception as email_error:
            logging.error(f"Error sending subscription emails: {str(email_error)}")
            # Continue processing even if email fails
        
        # Store the subscription request in database (you can add this later)
        
        return jsonify({
            'success': True,
            'message': 'Your subscription request has been received',
            'requestId': request_id
        }), 200
        
    except Exception as e:
        logging.error(f"Error processing subscription request: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'An error occurred processing your request'
        }), 500