import uuid
import os
import time
from flask import current_app
from datetime import datetime

class SupportService:
    """Service to handle support tickets"""
    
    def __init__(self):
        self._initialized = False
        self.appwrite_service = None
        self.email_service = None
        self.noreply_email = None
    
    def _initialize_if_needed(self):
        """Lazy initialization to avoid app context issues"""
        if not self._initialized:
            from .appwrite_service import AppwriteService
            from .email_service import EmailService
            
            self.appwrite_service = AppwriteService()
            self.email_service = EmailService(email_type='support')
            self.noreply_email = EmailService(email_type='noreply')
            self._initialized = True
    
    def create_ticket(self, ticket_data):
        """
        Create a new support ticket and send notifications
        
        Args:
            ticket_data (dict): Data for the support ticket
        
        Returns:
            str: The created ticket ID
        """
        self._initialize_if_needed()
        
        try:
            # Generate a ticket ID
            ticket_id = f"GTKT-{int(time.time())}-{uuid.uuid4().hex[:6].upper()}"
            
            # Add ticket ID and timestamp to data
            ticket_data['ticket_id'] = ticket_id
            ticket_data['created_at'] = datetime.now().isoformat()
            ticket_data['status'] = 'open'
            
            # Store in Appwrite if available, otherwise log locally
            try:
                # Initialize Appwrite
                self.appwrite_service._initialize_client()
                
                # Create document in tickets collection
                self.appwrite_service.database.create_document(
                    database_id=self.appwrite_service.database_id,
                    collection_id=os.environ.get('APPWRITE_COLLECTION_ID_TICKETS'),
                    document_id=ticket_id,
                    data={
                        'ticketId': ticket_id,
                        'name': ticket_data.get('name'),
                        'email': ticket_data.get('email'),
                        'subject': ticket_data.get('subject'),
                        'category': ticket_data.get('category', 'general'),
                        'message': ticket_data.get('message'),
                        'status': 'open',
                        'ipAddress': ticket_data.get('ip_address'),
                        'userAgent': ticket_data.get('user_agent'),
                        'hasAttachment': bool(ticket_data.get('attachment_path')),
                        'attachmentName': ticket_data.get('attachment_name'),
                        'createdAt': int(time.time())
                    }
                )
                print(f"Support ticket {ticket_id} stored in Appwrite")
            except Exception as store_err:
                print(f"Failed to store in Appwrite, logging locally: {str(store_err)}")
                # Fallback to local log
                log_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), 'support_tickets')
                os.makedirs(log_dir, exist_ok=True)
                
                with open(os.path.join(log_dir, f"{ticket_id}.json"), 'w') as f:
                    import json
                    json.dump(ticket_data, f, indent=4, default=str)
            
            # Send confirmation email to user
            try:
                self.send_ticket_confirmation(
                    ticket_data.get('email'),
                    ticket_data.get('name'),
                    ticket_id,
                    ticket_data.get('subject')
                )
            except Exception as email_err:
                print(f"Failed to send confirmation email: {str(email_err)}")
            
            # Send notification to support team
            try:
                self.send_ticket_notification(ticket_data)
            except Exception as notify_err:
                print(f"Failed to send team notification: {str(notify_err)}")
            
            return ticket_id
            
        except Exception as e:
            print(f"Error creating support ticket: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    
    def send_ticket_confirmation(self, to_email, name, ticket_id, subject):
        """Send confirmation email to user"""
        self._initialize_if_needed()
        
        if not to_email:
            return False
            
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
        
        return self.noreply_email.send_email(to_email, confirmation_subject, html_content)
    
    def send_ticket_notification(self, ticket_data):
        """Send notification to support team about new ticket"""
        self._initialize_if_needed()
        
        support_email = current_app.config.get('SUPPORT_EMAIL', 'support@ghosttalk.me')
        
        ticket_id = ticket_data.get('ticket_id')
        subject = f"New Support Ticket: {ticket_data.get('subject')} - {ticket_id}"
        
        # Prepare attachment info if applicable
        attachment_info = ""
        if ticket_data.get('attachment_name'):
            attachment_info = f"""<p><strong>Attachment:</strong> {ticket_data.get('attachment_name')} 
                                 <span style="color: #5851D8;">(Attached to this email)</span></p>"""
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #5851D8; text-align: center;">New Support Ticket</h1>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
                <p><strong>Ticket ID:</strong> {ticket_id}</p>
                <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p><strong>User Information:</strong></p>
                <ul>
                    <li><strong>Name:</strong> {ticket_data.get('name')}</li>
                    <li><strong>Email:</strong> {ticket_data.get('email')}</li>
                </ul>
                
                <p><strong>Ticket Details:</strong></p>
                <ul>
                    <li><strong>Subject:</strong> {ticket_data.get('subject')}</li>
                    <li><strong>Category:</strong> {ticket_data.get('category')}</li>
                    <li><strong>IP Address:</strong> {ticket_data.get('ip_address', 'Not available')}</li>
                    <li><strong>User Agent:</strong> {ticket_data.get('user_agent', 'Not available')}</li>
                </ul>
                
                <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Message:</strong></p>
                    <div style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
                        {ticket_data.get('message')}
                    </div>
                </div>
                
                {attachment_info}
            </div>
        </div>
        """
        
        # Send with attachment if available
        return self.email_service.send_email(
            support_email, 
            subject, 
            html_content, 
            attachment_path=ticket_data.get('attachment_path')
        )