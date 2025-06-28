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
  const [isSvg, setIsSvg] = useState<boolean>(false);
  
  useEffect(() => {
    // Construct the appropriate avatar URL
    if (avatarId) {
      // Check if it might be an SVG
      const isSvgFile = avatarId.toLowerCase().includes('.svg') || 
                         avatarId.toLowerCase().endsWith('svg');
      setIsSvg(isSvgFile);
      
      // For backend-served avatars
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://192.168.18.2:5000/api';
      setAvatarUrl(`${apiBaseUrl}/user/avatar/${avatarId}`);
    } else {
      // Fallback to initials avatar
      setAvatarUrl('https://ionicframework.com/docs/img/demos/avatar.svg');
      setIsSvg(true);
    }
  }, [avatarId, bucketId, username]);
  
  return (
    <IonAvatar>
      <img 
        src={avatarUrl} 
        alt={`${username}'s avatar`}
        className={`avatar-image ${isSvg ? 'svg-avatar' : ''}`}
        onError={(e) => {
          console.log('Avatar failed to load, using default');
          e.currentTarget.src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
        }}
      />
    </IonAvatar>
  );
};

export default UserAvatar;