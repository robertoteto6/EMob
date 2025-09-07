import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  DocumentData, 
  QueryDocumentSnapshot,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

// Tipos genéricos para Firestore
export interface FirestoreDocument {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Servicio genérico para operaciones CRUD
export class FirestoreService<T extends FirestoreDocument> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Crear documento
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
  if (!db) throw new Error('Firestore no disponible');
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Obtener documento por ID
  async getById(id: string): Promise<T | null> {
    try {
  if (!db) throw new Error('Firestore no disponible');
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document ${id} from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Obtener todos los documentos
  async getAll(limitCount?: number): Promise<T[]> {
    try {
  if (!db) throw new Error('Firestore no disponible');
      let q = query(collection(db, this.collectionName), orderBy('createdAt', 'desc'));
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error getting documents from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Obtener documentos con filtro
  async getWhere(field: string, operator: any, value: any, limitCount?: number): Promise<T[]> {
    try {
  if (!db) throw new Error('Firestore no disponible');
      let q = query(
        collection(db, this.collectionName), 
        where(field, operator, value),
        orderBy('createdAt', 'desc')
      );
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error querying documents from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Actualizar documento
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    try {
  if (!db) throw new Error('Firestore no disponible');
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`Error updating document ${id} in ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Eliminar documento
  async delete(id: string): Promise<void> {
    try {
  if (!db) throw new Error('Firestore no disponible');
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document ${id} from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Escuchar cambios en tiempo real
  onSnapshot(callback: (documents: T[]) => void, errorCallback?: (error: Error) => void): Unsubscribe {
    if (!db) {
      // Devuelve un no-op unsubscribe
      return () => {};
    }
    const q = query(collection(db, this.collectionName), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, 
      (querySnapshot) => {
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        callback(documents);
      },
      errorCallback
    );
  }

  // Escuchar cambios de un documento específico
  onDocumentSnapshot(id: string, callback: (document: T | null) => void, errorCallback?: (error: Error) => void): Unsubscribe {
    if (!db) {
      return () => {};
    }
    const docRef = doc(db, this.collectionName, id);
    
    return onSnapshot(docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const document = {
            id: docSnap.id,
            ...docSnap.data()
          } as T;
          callback(document);
        } else {
          callback(null);
        }
      },
      errorCallback
    );
  }
}

// Ejemplos de uso específico
export interface UserProfile extends FirestoreDocument {
  email: string;
  displayName: string;
  favoriteTeams: string[];
  preferences: {
    notifications: boolean;
    theme: 'dark' | 'light';
    language: string;
  };
}

export interface UserPrediction extends FirestoreDocument {
  userId: string;
  matchId: string;
  prediction: {
    winner: string;
    score?: string;
    confidence: number;
  };
  points?: number;
  resolved: boolean;
}

// Servicios específicos
export const userProfileService = new FirestoreService<UserProfile>('userProfiles');
export const userPredictionService = new FirestoreService<UserPrediction>('userPredictions');

// Funciones de utilidad
export const createUserProfile = async (userId: string, email: string, displayName: string): Promise<void> => {
  try {
    await userProfileService.create({
      email,
      displayName,
      favoriteTeams: [],
      preferences: {
        notifications: true,
        theme: 'dark',
        language: 'es'
      }
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserPredictions = async (userId: string): Promise<UserPrediction[]> => {
  try {
    return await userPredictionService.getWhere('userId', '==', userId);
  } catch (error) {
    console.error('Error getting user predictions:', error);
    throw error;
  }
};