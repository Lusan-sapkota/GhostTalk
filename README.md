# GhostTalk - Social Network App

## Development Status

This project is under active development. Core backend and frontend scaffolding is in place, but several features and polish remain.

Planned / in-progress work:
- Real-time notifications and video calling
- Chat improvements and WebSocket stability
- Rich-text editor and media handling for posts
- Expanded test coverage and CI configuration
- Performance, security hardening, and production deployment scripts

Contributions welcome — please open issues or PRs. For local development, follow the Installation & Setup section above.

A full-stack social networking application built with Django REST API backend and React Native (Expo) frontend. Features include user authentication, posts, comments, likes, friend requests, real-time chat, and more.

## 🚀 Features

### Core Features

- **User Authentication**: Register, login, profile management
- **Social Feed**: View posts from followed users
- **Post Management**: Create, edit, delete posts with rich text support
- **Interactions**: Like posts and comments, save posts
- **Friend System**: Send/accept friend requests, manage friendships
- **Real-time Chat**: Private messaging between friends
- **Notifications**: Get notified of likes, comments, follows, and friend requests
- **Search**: Find posts and users

### Technical Features

- **RESTful API**: Well-documented Django REST API
- **Real-time Communication**: WebSocket support for chat
- **Responsive Design**: Mobile-first React Native app
- **Cross-platform**: iOS and Android support via Expo
- **Secure**: JWT token authentication, input validation
- **Scalable**: Modular architecture with proper separation of concerns

## 🛠 Tech Stack

### Backend

- **Django** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Database (SQLite for development)
- **Channels** - WebSocket support for real-time features
- **Celery** - Background task processing
- **Redis** - Caching and message broker

### Frontend

- **React Native** - Mobile app framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Navigation
- **Axios** - HTTP client
- **AsyncStorage** - Local storage

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn
- PostgreSQL (optional, SQLite works for development)
- Redis (for production/real-time features)

## 🔧 Installation & Setup

### Backend Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Lusan-sapkota/GhostTalk.git
   cd GhostTalk/backend
   ```

2. **Create virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Database setup**

   ```bash
   python manage.py migrate
   ```

5. **Create superuser**

   ```bash
   python manage.py createsuperuser
   ```

6. **Run development server**

   ```bash
   python manage.py runserver
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd ../frontend/GhostTalk
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install additional packages**

   ```bash
   npm install axios @react-native-async-storage/async-storage
   ```

4. **Start development server**

   ```bash
   npm start
   ```

5. **Run on device/emulator**

   ```bash
   # For iOS
   npm run ios

   # For Android
   npm run android

   # For web
   npm run web
   ```

## 📱 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/register/` | User registration |
| POST | `/api/auth/token/` | User login |
| GET | `/user/me/` | Get current user profile |
| PUT | `/user/me/` | Update user profile |

### Post Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/home/` | Get all posts |
| GET | `/feed/` | Get posts from followed users |
| POST | `/post/new/` | Create new post |
| GET | `/post/{id}/` | Get post details |
| PUT | `/post/{id}/update/` | Update post |
| DELETE | `/post/{id}/delete/` | Delete post |
| POST | `/post/like/` | Like/unlike post |
| POST | `/post/save/` | Save/unsave post |

### Friend System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/friend/list/{user_id}` | Get user's friends |
| POST | `/friend/friend_request/` | Send friend request |
| GET | `/friend/friend_requests/{user_id}/` | Get friend requests |
| GET | `/friend/friend_request_accept/{id}/` | Accept friend request |
| GET | `/friend/friend_request_decline/{id}/` | Decline friend request |
| POST | `/friend/friend_remove/` | Remove friend |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chats/` | Get user's chat rooms |
| POST | `/chats/chat/{friend_id}` | Create/start chat with friend |
| GET | `/chats/room/{room_id}-{friend_id}` | Get chat messages |

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications/` | Get user notifications |

## 🎯 Usage

### Backend Development

1. **Run migrations after model changes**

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

2. **Create API views** in respective app directories
3. **Test API endpoints** using tools like Postman or curl
4. **Run tests**

   ```bash
   python manage.py test
   ```

### Frontend Development

1. **Update API calls** in `app/api.ts`
2. **Create new screens** in `app/screens/`
3. **Add components** in `components/`
4. **Update navigation** in respective layout files
5. **Test on multiple platforms**

## 🏗 Project Structure

```
GhostTalk/
├── backend/
│   ├── myproject/          # Main Django project
│   ├── blog/              # Posts and comments app
│   ├── users/             # User management app
│   ├── friend/            # Friend system app
│   ├── chat/              # Chat functionality app
│   ├── notification/      # Notifications app
│   ├── videocall/         # Video calling app
│   ├── db.sqlite3         # Database
│   ├── manage.py          # Django management script
│   └── requirements.txt   # Python dependencies
├── frontend/
│   └── GhostTalk/
│       ├── app/
│       │   ├── (tabs)/    # Main tab screens
│       │   ├── screens/   # Additional screens
│       │   ├── api.ts     # API integration
│       │   └── _layout.tsx # Root layout
│       ├── components/    # Reusable components
│       ├── constants/     # App constants
│       ├── hooks/         # Custom hooks
│       └── package.json   # Node dependencies
└── README.md
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for frontend-backend communication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Data Sanitization**: HTML sanitization for rich text content

## 🚀 Deployment

### Backend Deployment

1. Set `DEBUG = False` in settings
2. Configure production database (PostgreSQL)
3. Set up Redis for caching
4. Configure static/media file serving
5. Set up SSL certificate
6. Deploy to platforms like Heroku, AWS, or DigitalOcean

### Frontend Deployment

1. **Build production app**

   ```bash
   npm run build
   ```

2. **Deploy to Expo Application Services (EAS)**

   ```bash
   npx eas build --platform ios
   npx eas build --platform android
   ```

3. **Submit to app stores**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for frontend code
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Lusan Sapkota** - *Initial work* - [Lusan-sapkota](https://github.com/Lusan-sapkota)
- **Portfolio** - [Lusan Sapkota](https://lusansapkota.com.np)

## 🙏 Acknowledgments

- Django community for the excellent framework
- React Native community for the mobile framework
- All contributors and supporters

## 📞 Support

For support, email lusansapkota@example.com or create an issue in the repository.

---

## Happy coding! 🎉
