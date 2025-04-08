import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonChip,
  IonAvatar,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  IonFab,
  IonFabButton,
  IonList,
  IonSkeletonText,
  IonImg,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton
} from '@ionic/react';
import {
  peopleOutline,
  chatbubbleEllipsesOutline,
  timeOutline,
  flameOutline,
  sparklesOutline,
  informationCircleOutline,
  addOutline,
  heartOutline,
  chatbubblesOutline,
  chevronForwardOutline,
  starOutline,
  star,
  ribbonOutline,
  personCircleOutline,
  lockClosedOutline,
  shieldCheckmarkOutline,
  logoTwitter,
  logoFacebook,
  logoInstagram,
  logoGithub,
  closeOutline
} from 'ionicons/icons';
import BackHeaderComponent from '../components/BackHeaderComponent';
import './CommunityPage.css';

// Mock data for the community page
const topics = [
  {
    id: 1,
    title: "Privacy in the digital age",
    author: "GhostUser42",
    replies: 28,
    likes: 47,
    isHot: true,
    lastActive: "2h ago",
    category: "Privacy"
  },
  {
    id: 2,
    title: "Best encryption practices for messaging",
    author: "SecureComm",
    replies: 34,
    likes: 56,
    isHot: true,
    lastActive: "30m ago",
    category: "Security"
  },
  {
    id: 3,
    title: "App feature suggestions thread",
    author: "GhostMaster",
    replies: 76,
    likes: 120,
    isPinned: true,
    lastActive: "1h ago",
    category: "Features"
  },
  {
    id: 4,
    title: "How to set up ghost mode properly?",
    author: "NewGhost",
    replies: 12,
    likes: 18,
    lastActive: "4h ago",
    category: "Help"
  },
  {
    id: 5,
    title: "Introductions - Tell us about yourself",
    author: "CommunityMod",
    replies: 149,
    likes: 83,
    isPinned: true,
    lastActive: "10m ago",
    category: "General"
  }
];

const categories = [
  { name: "General", icon: chatbubblesOutline, count: 134 },
  { name: "Privacy", icon: lockClosedOutline, count: 89 },
  { name: "Security", icon: shieldCheckmarkOutline, count: 56 },
  { name: "Features", icon: sparklesOutline, count: 42 },
  { name: "Help", icon: informationCircleOutline, count: 78 }
];

const socialLinks = [
  { name: "Twitter", icon: logoTwitter, url: "https://twitter.com/ghosttalk", color: "primary" },
  { name: "Facebook", icon: logoFacebook, url: "https://facebook.com/ghosttalk", color: "tertiary" },
  { name: "Instagram", icon: logoInstagram, url: "https://instagram.com/ghosttalk", color: "danger" },
  { name: "GitHub", icon: logoGithub, url: "https://github.com/ghosttalk", color: "dark" }
];

const CommunityPage: React.FC = () => {
  const [segment, setSegment] = useState<string>('trending');
  const [searchText, setSearchText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showGuidelines, setShowGuidelines] = useState<boolean>(false);

  const handleSegmentChange = (e: CustomEvent) => {
    setSegment(e.detail.value);
    setIsLoading(true);
    // Simulate loading data
    setTimeout(() => setIsLoading(false), 1000);
  };

  const renderTopics = () => {
    if (isLoading) {
      return Array(4).fill(0).map((_, i) => (
        <IonCard key={`skeleton-${i}`} className="community-topic-card">
          <IonCardContent>
            <div className="community-topic-header">
              <IonSkeletonText animated style={{ width: '60%', height: '24px' }} />
            </div>
            <div className="community-topic-meta">
              <IonSkeletonText animated style={{ width: '40%' }} />
            </div>
            <div className="community-topic-stats">
              <IonSkeletonText animated style={{ width: '90%' }} />
            </div>
          </IonCardContent>
        </IonCard>
      ));
    }

    return topics.map(topic => (
      <IonCard key={topic.id} className="community-topic-card">
        <IonCardContent>
          <div className="community-topic-header">
            {topic.isPinned && (
              <IonChip color="tertiary" outline className="community-pin-chip">
                <IonIcon icon={ribbonOutline} />
                <IonLabel>Pinned</IonLabel>
              </IonChip>
            )}
            {topic.isHot && (
              <IonChip color="danger" outline className="community-hot-chip">
                <IonIcon icon={flameOutline} />
                <IonLabel>Hot</IonLabel>
              </IonChip>
            )}
            <h3>{topic.title}</h3>
          </div>
          
          <div className="community-topic-meta">
            <div className="community-author">
              <IonAvatar className="community-avatar">
                <div className="community-avatar-placeholder">
                  <IonIcon icon={personCircleOutline} />
                </div>
              </IonAvatar>
              <span>{topic.author}</span>
            </div>
            <IonChip color="medium" outline className="community-category-chip">
              {topic.category}
            </IonChip>
          </div>
          
          <div className="community-topic-stats">
            <div className="community-stat">
              <IonIcon icon={chatbubbleEllipsesOutline} />
              <span>{topic.replies} replies</span>
            </div>
            <div className="community-stat">
              <IonIcon icon={heartOutline} />
              <span>{topic.likes} likes</span>
            </div>
            <div className="community-stat">
              <IonIcon icon={timeOutline} />
              <span>{topic.lastActive}</span>
            </div>
          </div>
        </IonCardContent>
      </IonCard>
    ));
  };

  return (
    <IonPage className="community-page">
      <BackHeaderComponent title="Community" defaultHref='/support' />
      
      <IonContent>
        <div className="community-container">
          <div className="community-hero">
            <div className="community-hero-content">
              <h1>GhostTalk Community</h1>
              <p>Join the conversation with fellow privacy enthusiasts</p>
              <IonButton className="community-join-button" expand="block">
                Join the Community
              </IonButton>
            </div>
            <div className="community-hero-graphic">
              <div className="community-ghost-icon">
                <IonIcon icon={peopleOutline} />
              </div>
            </div>
          </div>
          
          <div className="community-search">
            <IonSearchbar
              value={searchText}
              onIonChange={e => setSearchText(e.detail.value!)}
              placeholder="Search discussions"
              className="community-searchbar"
            />
          </div>
          
          <div className="community-nav">
            <IonSegment value={segment} onIonChange={handleSegmentChange}>
              <IonSegmentButton value="trending">
                <IonIcon icon={flameOutline} />
                <IonLabel>Trending</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="recent">
                <IonIcon icon={timeOutline} />
                <IonLabel>Recent</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="popular">
                <IonIcon icon={starOutline} />
                <IonLabel>Popular</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>
          
          <div className="community-content">
            <div className="community-main">
              <h2 className="community-section-title">
                {segment === 'trending' ? 'Trending Discussions' : 
                 segment === 'recent' ? 'Recent Discussions' : 'Popular Discussions'}
              </h2>
              
              <div className="community-topics">
                {renderTopics()}
              </div>
            </div>
            
            <div className="community-sidebar">
              <IonCard className="community-sidebar-card">
                <IonCardHeader>
                  <IonCardTitle>Categories</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList lines="none">
                    {categories.map(category => (
                      <IonItem 
                        key={category.name} 
                        button 
                        detail
                        className="community-category-item"
                      >
                        <IonIcon slot="start" icon={category.icon} color="primary" />
                        <IonLabel>{category.name}</IonLabel>
                        <IonBadge slot="end" color="light">{category.count}</IonBadge>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
              
              <IonCard className="community-sidebar-card community-guidelines-card">
                <IonCardHeader>
                  <IonCardTitle>Community Guidelines</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>Our community is built on respect, privacy, and constructive discussions.</p>
                  <IonButton 
                    expand="block" 
                    fill="clear"
                    onClick={() => setShowGuidelines(true)}
                  >
                    Read Guidelines
                    <IonIcon slot="end" icon={chevronForwardOutline} />
                  </IonButton>
                </IonCardContent>
              </IonCard>
              
              <IonCard className="community-sidebar-card community-spotlight">
                <IonCardHeader>
                  <IonCardTitle>Member Spotlight</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="community-spotlight-content">
                    <IonAvatar className="community-spotlight-avatar">
                      <img src="assets/images/spotlight-user.jpg" alt="Featured member" />
                    </IonAvatar>
                    <div className="community-spotlight-info">
                      <h3>PrivacyGuardian</h3>
                      <p>Contributed 42 helpful posts this month</p>
                      <div className="community-spotlight-rating">
                        {Array(5).fill(0).map((_, i) => (
                          <IonIcon key={i} icon={star} color="warning" />
                        ))}
                      </div>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
              
              <IonCard className="community-sidebar-card community-social-card">
                <IonCardHeader>
                  <IonCardTitle>Connect With Us</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>Follow GhostTalk on social media for updates and announcements</p>
                  <div className="community-social-links">
                    {socialLinks.map(link => (
                      <a 
                        key={link.name} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="community-social-link"
                        aria-label={link.name}
                      >
                        <div className={`community-social-icon community-social-${link.name.toLowerCase()}`}>
                          <IonIcon icon={link.icon} />
                        </div>
                        <span>{link.name}</span>
                      </a>
                    ))}
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          </div>
        </div>
        
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton className="community-fab-button">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        {/* Guidelines Modal */}
        <IonModal isOpen={showGuidelines} onDidDismiss={() => setShowGuidelines(false)} className="community-guidelines-modal">
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Community Guidelines</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowGuidelines(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div className="community-guidelines-content">
              <h2>Welcome to the GhostTalk Community</h2>
              
              <p className="community-guidelines-intro">
                Our community thrives on respectful conversation, privacy advocacy, and mutual assistance.
                These guidelines help us maintain a positive environment for everyone.
              </p>
              
              <div className="community-guideline-section">
                <h3>1. Privacy First</h3>
                <p>
                  Respecting privacy is our core value. Never request, share, or encourage sharing of personal information.
                  Remember that privacy is a fundamental right we all defend here.
                </p>
              </div>
              
              <div className="community-guideline-section">
                <h3>2. Be Respectful</h3>
                <p>
                  Treat others as you wish to be treated. Disagreements are natural, but express them respectfully.
                  No harassment, hate speech, or personal attacks will be tolerated.
                </p>
              </div>
              
              <div className="community-guideline-section">
                <h3>3. Quality Contributions</h3>
                <p>
                  Post meaningful, relevant content that adds value. Search before posting to avoid duplicates.
                  Use clear titles and appropriate categories to help others find your content.
                </p>
              </div>
              
              <div className="community-guideline-section">
                <h3>4. Security Matters</h3>
                <p>
                  Don't share information that could compromise security. No discussing exploits or vulnerabilities
                  without responsible disclosure. We're here to build security, not break it.
                </p>
              </div>
              
              <div className="community-guideline-section">
                <h3>5. Moderation</h3>
                <p>
                  Moderators work to maintain these standards. Decisions may sometimes be disputed through private channels.
                  Remember that moderation exists to preserve our community values.
                </p>
              </div>
              
              <div className="community-guideline-footer">
                <p>
                  By participating in our community, you agree to follow these guidelines.
                  Repeated violations may result in temporary or permanent restrictions.
                </p>
                
                <IonButton 
                  expand="block" 
                  className="community-guidelines-close-button"
                  onClick={() => setShowGuidelines(false)}
                >
                  I Understand
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default CommunityPage;