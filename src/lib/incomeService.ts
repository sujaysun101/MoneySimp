// src/lib/incomeService.ts
"use client";

import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';
import type { IncomeSource } from './types';

export async function addIncome(userId: string, incomeData: Omit<IncomeSource, 'id'>): Promise<string> {
  if (!db) {
    throw new Error('Firestore database instance is not initialized.');
  }
  
  // Use user subcollection structure: users/{userId}/income_sources
  const incomeRef = collection(db, 'users', userId, 'income_sources');
  
  const newIncome = {
    ...incomeData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(incomeRef, newIncome);
  return docRef.id;
}

export async function updateIncome(incomeId: string, updates: Partial<IncomeSource>): Promise<void> {
  if (!db) {
    throw new Error('Firestore database instance is not initialized.');
  }
  
  if (!auth?.currentUser) {
    throw new Error('User not authenticated.');
  }
  
  // Use user subcollection structure: users/{userId}/income_sources/{incomeId}
  const incomeRef = doc(db, 'users', auth.currentUser.uid, 'income_sources', incomeId);
  
  await updateDoc(incomeRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function removeIncome(incomeId: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore database instance is not initialized.');
  }
  
  if (!auth?.currentUser) {
    throw new Error('User not authenticated.');
  }
  
  // Use user subcollection structure: users/{userId}/income_sources/{incomeId}
  const incomeRef = doc(db, 'users', auth.currentUser.uid, 'income_sources', incomeId);
  await deleteDoc(incomeRef);
}
