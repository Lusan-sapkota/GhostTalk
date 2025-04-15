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
            from flask import current_app
            
            self.appwrite_service = AppwriteService()
            self.email_service = EmailService(email_type='support')
            self.noreply_email = EmailService(email_type='noreply')
            
            # Get tickets collection ID from app config
            self.appwrite_service.tickets_collection_id = current_app.config.get('APPWRITE_COLLECTION_ID_TICKETS')
            
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
                    collection_id=self.appwrite_service.tickets_collection_id,  # Use this property instead
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
                        # Use ISO 8601 formatted datetime string instead of timestamp
                        'createdAt': datetime.now().isoformat()
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
                    ticket_data.get('subject'),
                    ticket_data.get('category'),
                    ticket_data.get('message'),
                    ticket_data.get('attachment_path'),
                    ticket_data.get('attachment_name')
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
    
    def send_ticket_confirmation(self, to_email, name, ticket_id, subject, category=None, message=None, attachment_path=None, attachment_name=None):
        """Send confirmation email to user"""
        self._initialize_if_needed()
        
        # Use the email_service method directly with complete data
        ticket_data = {
            'ticket_id': ticket_id,
            'name': name,
            'email': to_email,
            'subject': subject,
            'category': category or 'general',
            'message': message or '',
            'attachment_path': attachment_path,
            'attachment_name': attachment_name
        }
        
        return self.email_service.send_support_ticket_confirmation(ticket_data)

    def send_ticket_notification(self, ticket_data):
        """Send notification to support team about new ticket"""
        self._initialize_if_needed()
        
        # Use the email_service method directly
        return self.email_service.send_support_ticket_notification(ticket_data)