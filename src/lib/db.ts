import { collection, addDoc, getDocs, doc, deleteDoc, query, where, orderBy, Timestamp, updateDoc, increment, setDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';

export interface BlogPost {
  id?: string;
  title: string;
  content: string;
  category: string;
  coverImageURL?: string;
  authorId: string;
  authorEmail: string;
  createdAt: Timestamp;
  likesCount: number;
  violationCount?: number;
  isDraft?: boolean;
  viewsCount?: number;
}

export const CATEGORIES = ['World', 'Politics', 'Business', 'Technology', 'Science', 'Health', 'Sports', 'Arts'] as const;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio: string;
  role: string;
  isAdmin: boolean;
  banned: boolean;
  bannedReason?: string;
  violationCount: number;
  followers: string[];
  savedPostIds?: string[];
  createdAt: Timestamp;
}

export const ROLES = ['Owner', 'Editor-in-Chief', 'Senior Reporter', 'Staff Writer', 'Contributor', 'Guest Writer'] as const;

// ── Posts ──────────────────────────────────────────────────────────────────────

export const createPost = async (post: Omit<BlogPost, 'id' | 'createdAt' | 'likesCount'>) => {
  const docRef = await addDoc(collection(db, "posts"), {
    ...post,
    isDraft: post.isDraft ?? false,
    createdAt: Timestamp.now(),
    likesCount: 0,
    violationCount: 0,
    viewsCount: 0,
  });
  return docRef.id;
};

export const updatePost = async (postId: string, updates: Partial<Omit<BlogPost, 'id' | 'createdAt' | 'authorId' | 'authorEmail'>>) => {
  await updateDoc(doc(db, "posts", postId), updates);
};

export const getAllPosts = async () => {
  // Only get published posts for general feed
  const q = query(collection(db, "posts"), where("isDraft", "==", false), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BlogPost[];
};

export const getPostsByAuthor = async (authorId: string) => {
  const q = query(collection(db, "posts"), where("authorId", "==", authorId));
  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BlogPost[];
  return posts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
};

export const getPostsByCategory = async (category: string) => {
  let q;
  if (category.toLowerCase() === 'world') {
    q = query(collection(db, "posts"), where("isDraft", "==", false));
  } else {
    q = query(collection(db, "posts"), where("category", "==", category), where("isDraft", "==", false));
  }
  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BlogPost[];
  return posts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
};

export const getPostById = async (postId: string) => {
  const snap = await getDoc(doc(db, "posts", postId));
  return snap.exists() ? { id: snap.id, ...snap.data() } as BlogPost : null;
};

export const deletePost = async (postId: string) => {
  await deleteDoc(doc(db, "posts", postId));
};

export const likePost = async (postId: string) => {
  await updateDoc(doc(db, "posts", postId), { likesCount: increment(1) });
};

export const incrementPostViews = async (postId: string) => {
  await updateDoc(doc(db, "posts", postId), { viewsCount: increment(1) });
};

// ── Comments ───────────────────────────────────────────────────────────────────

export interface Comment {
  id?: string;
  postId: string;
  authorId?: string;
  authorEmail: string;
  content: string;
  createdAt: Timestamp;
}

export const addComment = async (comment: Omit<Comment, 'id' | 'createdAt'>) => {
  await addDoc(collection(db, "comments"), { ...comment, createdAt: Timestamp.now() });
};

export const getCommentsByPost = async (postId: string) => {
  const q = query(collection(db, "comments"), where("postId", "==", postId), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Comment[];
};

// ── User Profiles ──────────────────────────────────────────────────────────────

export const ensureUserProfile = async (uid: string, email: string): Promise<UserProfile> => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const isAdmin = uid === 'aU3lNVq9wsY8YGyoUlNs2iRvDBq2';
    const profile: UserProfile = {
      uid, email,
      displayName: email.split('@')[0],
      photoURL: '',
      bio: '',
      role: isAdmin ? 'Owner' : 'Contributor',
      isAdmin: isAdmin,
      banned: false,
      violationCount: 0,
      followers: [],
      savedPostIds: [],
      createdAt: Timestamp.now(),
    };
    await setDoc(userRef, profile);
    return profile;
  }
  const data = snap.data() as UserProfile;
  // Auto-upgrade if it's the admin but they are marked as something else
  if (uid === 'aU3lNVq9wsY8YGyoUlNs2iRvDBq2' && (data.role !== 'Owner' || !data.isAdmin)) {
    await updateDoc(userRef, { role: 'Owner', isAdmin: true });
    return { ...data, role: 'Owner', isAdmin: true };
  }
  return data;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() as UserProfile : null;
};

export const updateUserProfile = async (uid: string, updates: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'bio' | 'role'>>) => {
  await updateDoc(doc(db, "users", uid), updates);
};

export const isUserBanned = async (uid: string): Promise<boolean> => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data().banned === true : false;
};

export const recordViolation = async (uid: string, email: string) => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, { uid, email, displayName: email.split('@')[0], photoURL: '', bio: '', role: 'Contributor', isAdmin: false, banned: false, violationCount: 1, followers: [], savedPostIds: [], createdAt: Timestamp.now() });
    return { violationCount: 1, banned: false };
  }
  const current = snap.data().violationCount || 0;
  const newCount = current + 1;
  const shouldBan = newCount >= 3;
  await updateDoc(userRef, { violationCount: newCount, banned: shouldBan, ...(shouldBan ? { bannedReason: 'Automatic ban: 3 content violations.' } : {}) });
  return { violationCount: newCount, banned: shouldBan };
};

// ── Following ──────────────────────────────────────────────────────────────────

export const followUser = async (writerUid: string, followerUid: string) => {
  await updateDoc(doc(db, "users", writerUid), { followers: arrayUnion(followerUid) });
};

export const unfollowUser = async (writerUid: string, followerUid: string) => {
  await updateDoc(doc(db, "users", writerUid), { followers: arrayRemove(followerUid) });
};

// ── Bookmarks ──────────────────────────────────────────────────────────────────

export const savePost = async (uid: string, postId: string) => {
  await updateDoc(doc(db, "users", uid), { savedPostIds: arrayUnion(postId) });
};

export const unsavePost = async (uid: string, postId: string) => {
  await updateDoc(doc(db, "users", uid), { savedPostIds: arrayRemove(postId) });
};

// ── Notifications ──────────────────────────────────────────────────────────────

export interface AppNotification {
  id?: string;
  userId: string; // The user receiving the notification
  type: 'like' | 'comment' | 'follow' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export const createNotification = async (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
  await addDoc(collection(db, "notifications"), {
    ...notification,
    isRead: false,
    createdAt: Timestamp.now(),
  });
};

export const getUserNotifications = async (userId: string) => {
  const q = query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AppNotification[];
};

export const markNotificationRead = async (notificationId: string) => {
  await updateDoc(doc(db, "notifications", notificationId), { isRead: true });
};

export const markAllNotificationsRead = async (userId: string) => {
  const q = query(collection(db, "notifications"), where("userId", "==", userId), where("isRead", "==", false));
  const snapshot = await getDocs(q);
  const promises = snapshot.docs.map(d => updateDoc(doc(db, "notifications", d.id), { isRead: true }));
  await Promise.all(promises);
};

// ── Admin ──────────────────────────────────────────────────────────────────────

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(d => d.data()) as UserProfile[];
};

export const banUser = async (uid: string, reason: string) => {
  await setDoc(doc(db, "users", uid), { banned: true, bannedReason: reason }, { merge: true });
};

export const unbanUser = async (uid: string) => {
  await updateDoc(doc(db, "users", uid), { banned: false, bannedReason: '', violationCount: 0 });
};

export const setUserRole = async (uid: string, role: string, isAdmin: boolean) => {
  await updateDoc(doc(db, "users", uid), { role, isAdmin });
};
