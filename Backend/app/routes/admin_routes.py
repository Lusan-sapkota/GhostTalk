# @admin_bp.route('/diagnostics/collection-ids', methods=['GET'])
# @token_required
# def check_collection_ids(current_user_id):
#     """Check if collection IDs are valid"""
#     # First verify this is an admin user
#     user_doc = appwrite_service.get_user_document(current_user_id)
#     if not user_doc or user_doc.get('role') != 'admin':
#         return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
#     # Run the validation
#     results = appwrite_service.validate_collection_ids()
    
#     invalid_collections = [name for name, result in results.items() if result['status'] != 'VALID']
    
#     if invalid_collections:
#         return jsonify({
#             'success': False,
#             'message': f'Invalid collection IDs: {", ".join(invalid_collections)}',
#             'results': results
#         }), 400
#     else:
#         return jsonify({
#             'success': True,
#             'message': 'All collection IDs are valid',
#             'results': results
#         }), 200