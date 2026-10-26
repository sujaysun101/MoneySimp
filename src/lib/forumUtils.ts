// src/lib/forumUtils.ts
"use client";

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  increment,
  serverTimestamp,
  getFirestore,
  setDoc
} from 'firebase/firestore';
import { db, app } from '@/lib/firebase';

import type { 
  ForumPost, 
  ForumComment, 
  ForumVote, 
  ForumUser, 
  ForumCategory,
  ForumNotification,
  MonthlySummary 
} from './types';

export class ForumUtils {
  private static get db() {
    return db || (app ? getFirestore(app) : (undefined as any));
  }

  // Post Management
  static async createPost(
    authorId: string,
    postData: Omit<ForumPost, 'id' | 'author' | 'upvotes' | 'downvotes' | 'netScore' | 'commentCount' | 'viewCount' | 'createdAt' | 'updatedAt' | 'isEdited'>
  ): Promise<string> {
    const postsRef = collection(this.db, 'forum_posts');
    
    const newPost = {
      ...postData,
      authorId,
      upvotes: 0,
      downvotes: 0,
      netScore: 0,
      commentCount: 0,
      viewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isEdited: false
    };

    const docRef = await addDoc(postsRef, newPost);
    
    // Update user's post count directly in Firestore
    await updateDoc(doc(this.db, 'forum_users', authorId), {
      totalPosts: increment(1)
    });
    
    return docRef.id;
  }

  static async getPosts(
    category?: ForumCategory,
    sortBy: 'newest' | 'popular' | 'controversial' = 'newest',
    limitCount: number = 20,
    lastDoc?: any
  ): Promise<ForumPost[]> {
    let q = query(collection(this.db, 'forum_posts'));

    if (category) {
      q = query(q, where('category', '==', category));
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        q = query(q, orderBy('netScore', 'desc'), orderBy('createdAt', 'desc'));
        break;
      case 'controversial':
        q = query(q, orderBy('downvotes', 'desc'), orderBy('upvotes', 'desc'));
        break;
      default:
        q = query(q, orderBy('createdAt', 'desc'));
    }

    q = query(q, limit(limitCount));

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const posts: ForumPost[] = [];

    for (const docSnap of snapshot.docs) {
      const postData = { id: docSnap.id, ...docSnap.data() } as ForumPost;
      
      // Fetch author data
      const author = await this.getForumUser(postData.authorId);
      if (author) {
        postData.author = author;
        posts.push(postData);
      }
    }

    return posts;
  }

  static async getPost(postId: string): Promise<ForumPost | null> {
    const postDoc = await getDoc(doc(this.db, 'forum_posts', postId));
    
    if (!postDoc.exists()) return null;

    const postData = { id: postDoc.id, ...postDoc.data() } as ForumPost;
    
    // Increment view count
    await updateDoc(doc(this.db, 'forum_posts', postId), {
      viewCount: increment(1)
    });

    // Fetch author data
    const author = await this.getForumUser(postData.authorId);
    if (author) {
      postData.author = author;
    }

    return postData;
  }

  // Comment Management
  static async addComment(
    postId: string,
    authorId: string,
    content: string,
    parentCommentId?: string
  ): Promise<string> {
    const commentsRef = collection(this.db, 'forum_comments');
    
    const newComment = {
      postId,
      authorId,
      content,
      parentCommentId: parentCommentId || null,
      upvotes: 0,
      downvotes: 0,
      netScore: 0,
      replies: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isEdited: false,
      isDeleted: false
    };

    const docRef = await addDoc(commentsRef, newComment);
    
    // Update post comment count
    await updateDoc(doc(this.db, 'forum_posts', postId), {
      commentCount: increment(1)
    });

    // Create notification for post author
    const post = await this.getPost(postId);
    if (post && post.authorId !== authorId) {
      await this.createNotification(post.authorId, {
        type: 'comment',
        title: 'New Comment',
        message: `Someone commented on your post: "${post.title}"`,
        relatedPostId: postId,
        relatedCommentId: docRef.id,
        actionUrl: `/community/post/${postId}#comment-${docRef.id}`
      });
    }

    return docRef.id;
  }

  static async getComments(postId: string): Promise<ForumComment[]> {
    const q = query(
      collection(this.db, 'forum_comments'),
      where('postId', '==', postId),
      where('parentCommentId', '==', null),
      orderBy('netScore', 'desc'),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const comments: ForumComment[] = [];

    for (const docSnap of snapshot.docs) {
      const commentData = { id: docSnap.id, ...docSnap.data() } as ForumComment;
      
      // Fetch author data
      const author = await this.getForumUser(commentData.authorId);
      if (author) {
        commentData.author = author;
        
        // Fetch replies
        commentData.replies = await this.getReplies(commentData.id);
        
        comments.push(commentData);
      }
    }

    return comments;
  }

  static async getReplies(parentCommentId: string): Promise<ForumComment[]> {
    const q = query(
      collection(this.db, 'forum_comments'),
      where('parentCommentId', '==', parentCommentId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const replies: ForumComment[] = [];

    for (const docSnap of snapshot.docs) {
      const replyData = { id: docSnap.id, ...docSnap.data() } as ForumComment;
      
      // Fetch author data
      const author = await this.getForumUser(replyData.authorId);
      if (author) {
        replyData.author = author;
        replies.push(replyData);
      }
    }

    return replies;
  }

  // Voting System
  static async vote(
    userId: string,
    targetId: string,
    targetType: 'post' | 'comment',
    voteType: 'upvote' | 'downvote'
  ): Promise<void> {
    const votesRef = collection(this.db, 'forum_votes');
    
    // Check if user already voted
    const existingVoteQuery = query(
      votesRef,
      where('userId', '==', userId),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType)
    );
    
    const existingVotes = await getDocs(existingVoteQuery);
    
    // Remove existing vote if it exists
    if (!existingVotes.empty) {
      const existingVote = existingVotes.docs[0];
      const existingVoteData = existingVote.data() as ForumVote;
      
      await deleteDoc(existingVote.ref);
      
      // Decrement the old vote count
      const targetRef = targetType === 'post' 
        ? doc(this.db, 'forum_posts', targetId)
        : doc(this.db, 'forum_comments', targetId);
      
      const decrementField = existingVoteData.voteType === 'upvote' ? 'upvotes' : 'downvotes';
      await updateDoc(targetRef, {
        [decrementField]: increment(-1),
        netScore: increment(existingVoteData.voteType === 'upvote' ? -1 : 1)
      });
      
      // If same vote type, just remove and return
      if (existingVoteData.voteType === voteType) {
        return;
      }
    }

    // Add new vote
    await addDoc(votesRef, {
      userId,
      targetId,
      targetType,
      voteType,
      createdAt: serverTimestamp()
    });

    // Update vote counts
    const targetRef = targetType === 'post' 
      ? doc(this.db, 'forum_posts', targetId)
      : doc(this.db, 'forum_comments', targetId);
    
    const incrementField = voteType === 'upvote' ? 'upvotes' : 'downvotes';
    await updateDoc(targetRef, {
      [incrementField]: increment(1),
      netScore: increment(voteType === 'upvote' ? 1 : -1)
    });

    // Create notification for upvotes
    if (voteType === 'upvote') {
      let targetAuthorId: string;
      let targetTitle: string;
      
      if (targetType === 'post') {
        const post = await this.getPost(targetId);
        if (post && post.authorId !== userId) {
          targetAuthorId = post.authorId;
          targetTitle = post.title;
          
          await this.createNotification(targetAuthorId, {
            type: 'upvote',
            title: 'Post Upvoted',
            message: `Your post "${targetTitle}" received an upvote!`,
            relatedPostId: targetId,
            actionUrl: `/community/post/${targetId}`
          });
        }
      } else {
        const commentDoc = await getDoc(doc(this.db, 'forum_comments', targetId));
        if (commentDoc.exists()) {
          const comment = commentDoc.data() as ForumComment;
          if (comment.authorId !== userId) {
            await this.createNotification(comment.authorId, {
              type: 'upvote',
              title: 'Comment Upvoted',
              message: 'Your comment received an upvote!',
              relatedCommentId: targetId,
              actionUrl: `/community/post/${comment.postId}#comment-${targetId}`
            });
          }
        }
      }
    }
  }

  static async getUserVote(
    userId: string,
    targetId: string,
    targetType: 'post' | 'comment'
  ): Promise<'upvote' | 'downvote' | null> {
    const q = query(
      collection(this.db, 'forum_votes'),
      where('userId', '==', userId),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const vote = snapshot.docs[0].data() as ForumVote;
    return vote.voteType;
  }

  // User Management
  static async getForumUser(userId: string): Promise<ForumUser | null> {
    const userDoc = await getDoc(doc(this.db, 'forum_users', userId));
    
    if (!userDoc.exists()) {
      // Create default forum user
      return await this.createForumUser(userId);
    }

    return { id: userDoc.id, ...userDoc.data() } as ForumUser;
  }

  static async createForumUser(userId: string, userData?: Partial<ForumUser>): Promise<ForumUser> {
    const defaultUser: Omit<ForumUser, 'id'> = {
      displayName: userData?.displayName || 'Anonymous User',
      avatar: userData?.avatar,
      reputation: 0,
      joinedDate: new Date().toISOString(),
      totalPosts: 0,
      totalUpvotes: 0,
      totalDownvotes: 0,
      achievements: [],
      ...userData
    };

    await setDoc(doc(this.db, 'forum_users', userId), defaultUser, { merge: true });
    
    return { id: userId, ...defaultUser };
  }

  static async updateUserStats(userId: string, updates: Partial<ForumUser>): Promise<void> {
    await updateDoc(doc(this.db, 'forum_users', userId), updates);
  }

  // Notification System
  static async createNotification(
    userId: string,
    notificationData: Omit<ForumNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>
  ): Promise<void> {
    await addDoc(collection(this.db, 'forum_notifications'), {
      userId,
      ...notificationData,
      isRead: false,
      createdAt: serverTimestamp()
    });
  }

  static async getNotifications(userId: string, unreadOnly: boolean = false): Promise<ForumNotification[]> {
    if (!this.db) return [];
    let q = query(
      collection(this.db, 'forum_notifications'),
      where('userId', '==', userId),
      limit(50)
    );

    if (unreadOnly) {
      q = query(q, where('isRead', '==', false));
    }

    const snapshot = await getDocs(q);
    
    // Sort by createdAt in memory instead of in the database query
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ForumNotification[];

    return notifications.sort((a, b) => {
      const aTime = a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt 
        ? (a.createdAt as any).toDate() 
        : new Date(a.createdAt || 0);
      const bTime = b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt 
        ? (b.createdAt as any).toDate() 
        : new Date(b.createdAt || 0);
      return bTime.getTime() - aTime.getTime();
    });
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(this.db, 'forum_notifications', notificationId), {
      isRead: true
    });
  }

  // Search and Discovery
  static async searchPosts(searchTerm: string, category?: ForumCategory): Promise<ForumPost[]> {
    // Note: This is a simplified search. In production, you'd use Firestore text search or Algolia
    let q = query(collection(this.db, 'forum_posts'));

    if (category) {
      q = query(q, where('category', '==', category));
    }

    const snapshot = await getDocs(q);
    const posts: ForumPost[] = [];

    for (const docSnap of snapshot.docs) {
      const postData = { id: docSnap.id, ...docSnap.data() } as ForumPost;
      
      // Simple text matching (in production, use proper search)
      if (
        postData.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        postData.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        postData.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      ) {
        const author = await this.getForumUser(postData.authorId);
        if (author) {
          postData.author = author;
          posts.push(postData);
        }
      }
    }

    return posts.sort((a, b) => b.netScore - a.netScore);
  }

  static async getTrendingPosts(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<ForumPost[]> {
    const cutoffDate = new Date();
    
    switch (timeframe) {
      case 'day':
        cutoffDate.setDate(cutoffDate.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
    }

    const q = query(
      collection(this.db, 'forum_posts'),
      where('createdAt', '>=', cutoffDate),
      orderBy('netScore', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    const posts: ForumPost[] = [];

    for (const docSnap of snapshot.docs) {
      const postData = { id: docSnap.id, ...docSnap.data() } as ForumPost;
      
      const author = await this.getForumUser(postData.authorId);
      if (author) {
        postData.author = author;
        posts.push(postData);
      }
    }

    return posts;
  }

  // Reputation and Achievement System
  static async calculateReputation(userId: string): Promise<number> {
    const user = await this.getForumUser(userId);
    if (!user) return 0;

    // Reputation = (upvotes * 2) - downvotes + (posts * 1) + achievements
    const baseReputation = (user.totalUpvotes * 2) - user.totalDownvotes + user.totalPosts;
    const achievementBonus = user.achievements.length * 5;
    
    return Math.max(0, baseReputation + achievementBonus);
  }

  static async checkAchievements(userId: string): Promise<string[]> {
    const user = await this.getForumUser(userId);
    if (!user) return [];

    const newAchievements: string[] = [];
    const achievements = [
      { id: 'first_post', name: 'First Post', condition: user.totalPosts >= 1 },
      { id: 'contributor', name: 'Contributor', condition: user.totalPosts >= 5 },
      { id: 'popular', name: 'Popular', condition: user.totalUpvotes >= 10 },
      { id: 'helpful', name: 'Helpful', condition: user.totalUpvotes >= 50 },
      { id: 'expert', name: 'Expert', condition: user.totalUpvotes >= 100 && user.totalPosts >= 20 },
      { id: 'guru', name: 'Guru', condition: user.totalUpvotes >= 500 && user.totalPosts >= 100 },
      { id: 'legend', name: 'Legend', condition: user.totalUpvotes >= 1000 && user.totalPosts >= 200 }
    ];

    for (const achievement of achievements) {
      if (achievement.condition && !user.achievements.includes(achievement.id)) {
        newAchievements.push(achievement.id);
        user.achievements.push(achievement.id);
        
        // Create achievement notification
        await this.createNotification(userId, {
          type: 'achievement',
          title: 'Achievement Unlocked!',
          message: `You've earned the "${achievement.name}" achievement!`,
          actionUrl: '/community/profile'
        });
      }
    }

    if (newAchievements.length > 0) {
      await this.updateUserStats(userId, { 
        achievements: user.achievements,
        reputation: await this.calculateReputation(userId)
      });
    }

    return newAchievements;
  }

  // Monthly Summary Generation
  static async generateMonthlySummary(userId: string, month: string, year: number): Promise<MonthlySummary> {
    const startDate = new Date(year, parseInt(month) - 1, 1);
    const endDate = new Date(year, parseInt(month), 0);

    // Get user's posts and comments for the month
    const postsQuery = query(
      collection(this.db, 'forum_posts'),
      where('authorId', '==', userId),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );

    const commentsQuery = query(
      collection(this.db, 'forum_comments'),
      where('authorId', '==', userId),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );

    const [postsSnapshot, commentsSnapshot] = await Promise.all([
      getDocs(postsQuery),
      getDocs(commentsQuery)
    ]);

    const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ForumPost[];
    const comments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ForumComment[];

    // Calculate stats
    const totalUpvotesReceived = posts.reduce((sum, post) => sum + post.upvotes, 0) + 
                                comments.reduce((sum, comment) => sum + comment.upvotes, 0);

    const topPost = posts.sort((a, b) => b.netScore - a.netScore)[0];

    const summary: MonthlySummary = {
      id: `${userId}_${year}_${month}`,
      userId,
      month,
      year,
      totalPosts: posts.length,
      totalComments: comments.length,
      totalUpvotesReceived,
      totalUpvotesGiven: 0, // Would need to query votes given
      reputationGained: totalUpvotesReceived * 2 + posts.length,
      topPost,
      newAchievements: [], // Would be calculated from achievement history
      communityRank: 0, // Would need to calculate based on all users
      totalCommunityMembers: 0, // Would need to count all forum users
      savingsTipsShared: posts.filter(p => p.category === 'saving_tips').length,
      dealsShared: posts.filter(p => p.category === 'deals').length,
      createdAt: new Date().toISOString()
    };

    // Save summary
    await setDoc(doc(this.db, 'monthly_summaries', summary.id), summary, { merge: true });

    return summary;
  }
}

export default ForumUtils;
