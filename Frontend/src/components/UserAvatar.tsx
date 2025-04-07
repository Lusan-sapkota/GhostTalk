// Example component for displaying user avatars
import { useEffect, useState } from 'react';
import { IonAvatar } from '@ionic/react';

interface UserAvatarProps {
  avatarId: string;
  bucketId: string;
  username: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ avatarId, bucketId, username }) => {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  
  useEffect(() => {
    // Construct the full avatar URL from the ID
    if (avatarId && bucketId) {
      const baseUrl = process.env.REACT_APP_APPWRITE_ENDPOINT || 'http://localhost:5000';
      const projectId = process.env.REACT_APP_APPWRITE_PROJECT_ID || '';
      setAvatarUrl(`${baseUrl}/v1/storage/buckets/${bucketId}/files/${avatarId}/view?project=${projectId}`);
    } else {
      // Fallback to initials avatar
      const baseUrl = process.env.REACT_APP_APPWRITE_ENDPOINT || 'http://localhost:5000';
      setAvatarUrl(`${baseUrl}/v1/avatars/initials?name=${encodeURIComponent(username)}`);
    }
  }, [avatarId, bucketId, username]);

  return (
    <IonAvatar>
      <img src={avatarUrl} alt={`${username}'s avatar`} />
    </IonAvatar>
  );
};

export default UserAvatar;