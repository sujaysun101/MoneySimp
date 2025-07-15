import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc, Timestamp, orderBy, setDoc } from 'firebase/firestore';
import { db } from './config';

export interface Goal {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  createdAt: Date;
  updatedAt: Date;
  isCompleted: boolean;
  category?: string;
}

const GOALS_COLLECTION = 'goals';

export const createGoal = async (goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'currentAmount'>): Promise<string> => {
  try {
    const now = new Date();
    // Ensure description is never undefined (Firestore does not allow undefined fields)
    const safeGoalData = {
      ...goalData,
      description: goalData.description ?? "",
    };
    const goalRef = await addDoc(collection(db, GOALS_COLLECTION), {
      ...safeGoalData,
      currentAmount: 0,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
      targetDate: Timestamp.fromDate(new Date(goalData.targetDate)),
    });
    return goalRef.id;
  } catch (error) {
    console.error('Error creating goal:', error);
    throw new Error('Failed to create goal');
  }
};

export const getGoals = async (userId: string): Promise<Goal[]> => {
  try {
    const q = query(
      collection(db, GOALS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      targetDate: doc.data().targetDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Goal[];
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw new Error('Failed to fetch goals');
  }
};

export const updateGoalProgress = async (goalId: string, amount: number): Promise<void> => {
  try {
    const goalRef = doc(db, GOALS_COLLECTION, goalId);
    const goalSnap = await getDoc(goalRef);
    
    if (!goalSnap.exists()) {
      throw new Error('Goal not found');
    }
    
    const currentAmount = goalSnap.data().currentAmount || 0;
    const targetAmount = goalSnap.data().targetAmount;
    const newAmount = currentAmount + amount;
    
    await updateDoc(goalRef, {
      currentAmount: Math.min(newAmount, targetAmount),
      isCompleted: newAmount >= targetAmount,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating goal progress:', error);
    throw new Error('Failed to update goal progress');
  }
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, GOALS_COLLECTION, goalId));
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw new Error('Failed to delete goal');
  }
};

export const getSpendingRecommendation = async (userId: string): Promise<number> => {
  // This is a simplified example - in a real app, you would analyze the user's spending patterns
  // and income to provide a personalized recommendation
  try {
    // TODO: Replace with actual spending analysis
    // For now, return a fixed recommendation
    return 500; // $500 monthly recommendation
  } catch (error) {
    console.error('Error calculating spending recommendation:', error);
    return 300; // Fallback recommendation
  }
};

export const setUserAutoTransfer = async (userId: string, amount: number, aiReason: string) => {
  // Store the user's accepted AI transfer recommendation in a user settings collection
  try {
    const userSettingsRef = doc(db, 'userSettings', userId);
    await updateDoc(userSettingsRef, {
      autoTransferAmount: amount,
      autoTransferReason: aiReason,
      autoTransferUpdatedAt: new Date(),
    });
  } catch (error) {
    // If doc doesn't exist, create it
    if (
      (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'not-found') ||
      (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string' && (error as any).message.includes('No document to update'))
    ) {
      const userSettingsRef = doc(db, 'userSettings', userId);
      await setDoc(userSettingsRef, {
        autoTransferAmount: amount,
        autoTransferReason: aiReason,
        autoTransferUpdatedAt: new Date(),
      });
    } else {
      console.error('Error updating user auto-transfer:', error);
      throw new Error('Failed to update auto-transfer setting');
    }
  }
};
