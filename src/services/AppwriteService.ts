import { Client, Account, Databases, Storage, ID, Query, Models } from 'appwrite';

export class AppwriteService {
  client = new Client();
  account: Account;
  databases: Databases;
  storage: Storage;

  constructor() {
    this.client
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
    
    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client);
  }

  // Authentication methods
  async createAccount(email: string, password: string, name: string) {
    try {
      const userAccount = await this.account.create(
        ID.unique(),
        email,
        password,
        name
      );
      
      if (userAccount) {
        // Create login session
        return await this.login(email, password);
      } else {
        return userAccount;
      }
    } catch (error) {
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      return await this.account.createEmailSession(email, password);
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      return await this.account.get();
    } catch (error) {
      console.log('Error getting current user:', error);
      return null;
    }
  }

  async logout() {
    try {
      return await this.account.deleteSession('current');
    } catch (error) {
      throw error;
    }
  }

  // Chat methods
  async createMessage(senderId: string, receiverId: string, message: string, roomId?: string) {
    try {
      return await this.databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID_CHATS,
        ID.unique(),
        {
          senderId,
          receiverId,
          message,
          roomId: roomId || null,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      throw error;
    }
  }

  async getPrivateMessages(userId1: string, userId2: string) {
    try {
      return await this.databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID_CHATS,
        [
          Query.equal('$or', [
            Query.and([
              Query.equal('senderId', userId1),
              Query.equal('receiverId', userId2)
            ]),
            Query.and([
              Query.equal('senderId', userId2),
              Query.equal('receiverId', userId1)
            ])
          ]),
          Query.orderDesc('timestamp')
        ]
      );
    } catch (error) {
      throw error;
    }
  }

  async getRoomMessages(roomId: string) {
    try {
      return await this.databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID_CHATS,
        [
          Query.equal('roomId', roomId),
          Query.orderDesc('timestamp')
        ]
      );
    } catch (error) {
      throw error;
    }
  }

  // Chat Room methods
  async createChatRoom(name: string, description: string, isPrivate: boolean, creatorId: string, chatType: string = 'discussion', requireLogin: boolean = true) {
    try {
      return await this.databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID_CHAT_ROOMS,
        ID.unique(),
        {
          name,
          description,
          isPrivate,
          creatorId,
          members: [creatorId],
          chatType,
          requireLogin,
          createdAt: new Date().toISOString()
        }
      );
    } catch (error) {
      throw error;
    }
  }

  async getChatRooms(isPrivate: boolean) {
    try {
      return await this.databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID_CHAT_ROOMS,
        [
          Query.equal('isPrivate', isPrivate)
        ]
      );
    } catch (error) {
      throw error;
    }
  }

  async joinChatRoom(roomId: string, userId: string) {
    try {
      const room = await this.databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID_CHAT_ROOMS,
        roomId
      );
      
      const members = [...room.members, userId];
      
      return await this.databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID_CHAT_ROOMS,
        roomId,
        { members }
      );
    } catch (error) {
      throw error;
    }
  }

  // User methods
  async updateUserProfile(userId: string, data: object) {
    try {
      return await this.databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID_USERS,
        userId,
        data
      );
    } catch (error) {
      throw error;
    }
  }

  async upgradeToPro(userId: string) {
    try {
      return await this.databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID_USERS,
        userId,
        {
          isPro: true,
          proExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        }
      );
    } catch (error) {
      throw error;
    }
  }

  // File storage methods
  async uploadAvatar(file: File) {
    try {
      return await this.storage.createFile(
        import.meta.env.VITE_APPWRITE_STORAGE_ID,
        ID.unique(),
        file
      );
    } catch (error) {
      throw error;
    }
  }

  getFilePreview(fileId: string) {
    return this.storage.getFilePreview(
      import.meta.env.VITE_APPWRITE_STORAGE_ID,
      fileId
    );
  }

  // Random chat methods
  async findRandomUser(currentUserId: string) {
    try {
      const users = await this.databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COLLECTION_ID_USERS,
        [
          Query.notEqual('$id', currentUserId),
          Query.limit(50)
        ]
      );
      
      if (users.documents.length === 0) {
        return null;
      }
      
      // Select a random user
      const randomIndex = Math.floor(Math.random() * users.documents.length);
      return users.documents[randomIndex];
    } catch (error) {
      throw error;
    }
  }
}

export const appwriteService = new AppwriteService();