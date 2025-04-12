from .appwrite_service import AppwriteService

class UserService:
    def __init__(self):
        self.appwrite_service = AppwriteService()
    
    def get_user_profile(self, user_id):
        """Get user profile information"""
        try:
            # Get user from Appwrite
            user = self.appwrite_service.get_user(user_id)
            
            if not user:
                return {'success': False, 'message': 'User not found'}, 404
            
            # Return user profile
            return {
                'success': True,
                'user': {
                    'id': user['$id'],
                    'email': user['email'],
                    'name': user['name'],
                    'registration': user['registration'],
                    'avatar': user.get('avatar', None),
                    'proStatus': user.get('proStatus', 'free')
                }
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500
    
    def update_user_profile(self, user_id, data):
        """Update user profile information"""
        try:
            # Extract the values to update
            name = data.get('username')
            email = data.get('email')
            bio = data.get('bio')
            gender = data.get('gender')
            proStatus = data.get('proStatus')
            
            # Build the update data dictionary
            update_data = {}
            if name is not None:
                update_data['username'] = name
            if email is not None:
                update_data['email'] = email
            if bio is not None:
                update_data['bio'] = bio
            if gender is not None:
                update_data['gender'] = gender
            if proStatus is not None:
                update_data['proStatus'] = proStatus
            
            # Get user document and update it
            user_doc = self.appwrite_service.get_user_document(user_id)
            if not user_doc:
                return {'success': False, 'message': 'User not found'}, 404
            
            # Update the document
            self.appwrite_service.database.update_document(
                database_id=self.appwrite_service.database_id,
                collection_id=self.appwrite_service.users_collection_id,
                document_id=user_id,
                data=update_data
            )
            
            # Return updated profile
            user = self.appwrite_service.get_user(user_id)
            return {
                'success': True,
                'message': 'Profile updated successfully',
                'user': {
                    'id': user['$id'],
                    'email': user['email'],
                    'name': user.get('name', ''),
                    'proStatus': user_doc.get('proStatus', 'free'),
                    'bio': user_doc.get('bio', ''),
                    'gender': user_doc.get('gender', 'prefer_not_to_say')
                }
            }, 200
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500

    def update_online_status(self, user_id, is_online):
        """Update user's online status"""
        try:
            # Update online status in Appwrite
            success = self.appwrite_service.update_user_online_status(user_id, is_online)
            
            if success:
                return {
                    'success': True,
                    'message': 'Online status updated successfully'
                }, 200
            else:
                return {
                    'success': False,
                    'message': 'Failed to update online status'
                }, 500
        except Exception as e:
            return {'success': False, 'message': str(e)}, 500