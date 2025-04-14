import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from ..services.support_service import SupportService
from ..services.email_service import EmailService
from ..utils.security import token_required
import json
import time
from datetime import datetime

support_bp = Blueprint('support', __name__)
support_service = SupportService()

@support_bp.route('/ticket', methods=['POST'])
def create_support_ticket():
    """Create a new support ticket"""
    try:
        # For JSON requests (no attachment)
        if request.content_type and 'application/json' in request.content_type:
            data = request.json
            # No attachment handling
            ticket_data = {
                'name': data.get('name'),
                'email': data.get('email'),
                'subject': data.get('subject'),
                'category': data.get('category', 'general'),
                'message': data.get('message'),
                'ip_address': request.remote_addr,
                'user_agent': request.user_agent.string
            }
            # Create the ticket
            ticket_id = support_service.create_ticket(ticket_data)
            return jsonify({'success': True, 'message': 'Support ticket created', 'ticketId': ticket_id})
        else:
            return jsonify({'success': False, 'message': 'Invalid content type. Use application/json'}), 415
    except Exception as e:
        print(f"Error creating support ticket: {str(e)}")
        return jsonify({'success': False, 'message': f'Failed to create support ticket: {str(e)}'}), 500

@support_bp.route('/ticket/with-attachment', methods=['POST'])
def create_support_ticket_with_attachment():
    """Create a new support ticket with file attachment"""
    try:
        # Get form data
        name = request.form.get('name')
        email = request.form.get('email')
        subject = request.form.get('subject')
        category = request.form.get('category', 'general')
        message = request.form.get('message')
        
        if not all([name, email, subject, message]):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
            
        # Process attachment if present
        attachment_path = None
        attachment_name = None
        
        if 'attachment' in request.files:
            file = request.files['attachment']
            if file and file.filename:
                # Secure the filename
                attachment_name = secure_filename(file.filename)
                # Create uploads directory if it doesn't exist
                uploads_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'support_attachments')
                os.makedirs(uploads_dir, exist_ok=True)
                
                # Save the file
                attachment_path = os.path.join(uploads_dir, f"{uuid.uuid4()}_{attachment_name}")
                file.save(attachment_path)
        
        # Create ticket data
        ticket_data = {
            'name': name,
            'email': email,
            'subject': subject,
            'category': category,
            'message': message,
            'ip_address': request.remote_addr,
            'user_agent': request.user_agent.string,
            'attachment_path': attachment_path,
            'attachment_name': attachment_name
        }
        
        # Create the ticket
        ticket_id = support_service.create_ticket(ticket_data)
        
        return jsonify({'success': True, 'message': 'Support ticket created', 'ticketId': ticket_id})
    except Exception as e:
        print(f"Error creating support ticket with attachment: {str(e)}")
        return jsonify({'success': False, 'message': f'Failed to create support ticket: {str(e)}'}), 500

def send_ticket_confirmation(to_email, name, ticket_id, subject):
    """Send confirmation email to user"""
    try:
        noreply_email = EmailService()  # Use no-reply email
        confirmation_subject = f"Your GhostTalk Support Ticket #{ticket_id}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #5851D8;">GhostTalk Support</h1>
            </div>
            
            <p>Hello {name},</p>
            
            <p>Thank you for contacting GhostTalk Support. We have received your request regarding:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Ticket ID:</strong> {ticket_id}</p>
                <p><strong>Subject:</strong> {subject}</p>
            </div>
            
            <p>Our support team will review your message and respond as soon as possible. Please keep this ticket ID for your reference.</p>
            
            <p>If you need to provide additional information, please reply to this email and keep the ticket ID in the subject line.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #707070; font-size: 12px; text-align: center;">
                <p>© {datetime.now().year} GhostTalk. All rights reserved.</p>
            </div>
        </div>
        """
        
        noreply_email.send_email(to_email, confirmation_subject, html_content)
        return True
    except Exception as e:
        print(f"Error sending ticket confirmation: {str(e)}")
        return False