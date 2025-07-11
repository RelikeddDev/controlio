import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'transactions';

export const fetchTransactions = createAsyncThunk(
  'transactions/fetch',
  async () => {
    const q = query(collection(db, COLLECTION), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate().toISOString() : data.date
      };
    });
    return docs;
  }
);

export const addTransaction = createAsyncThunk(
  'transactions/add',
  async (transaction, { rejectWithValue }) => {
    console.log('🔄 addTransaction thunk, transaction:', transaction);
    if (
      !transaction.amount ||
      !transaction.date ||
      !transaction.categoryId ||
      !transaction.cardId
    ) {
      return rejectWithValue('Faltan campos requeridos para guardar la transacción');
    }

    const { id, ...cleaned } = transaction;
    const docRef = await addDoc(collection(db, COLLECTION), cleaned);
    console.log('✅ Guardado en Firestore con ID:', docRef.id);
    return { id: docRef.id, ...cleaned };
  }
);

// Nuevo thunk para guardar varias transacciones en lote
export const addTransactions = createAsyncThunk(
  'transactions/addMany',
  async (transactions, { rejectWithValue }) => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return rejectWithValue('No hay transacciones para guardar');
    }
    const batch = writeBatch(db);
    const colRef = collection(db, COLLECTION);
    const results = [];
    for (const tx of transactions) {
      if (
        !tx.amount ||
        !tx.date ||
        !tx.categoryId ||
        !tx.cardId
      ) {
        return rejectWithValue('Faltan campos requeridos en una o más transacciones');
      }
      const { id, ...cleaned } = tx;
      const docRef = doc(colRef); // genera un nuevo docRef
      batch.set(docRef, cleaned);
      results.push({ id: docRef.id, ...cleaned });
    }
    await batch.commit();
    console.log('✅ Guardadas en Firestore en lote:', results.length);
    return results;
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/update',
  async (transaction, { rejectWithValue }) => {
    const { id, ...data } = transaction;

    if (
      !data.amount ||
      !data.date ||
      !data.categoryId ||
      !data.cardId
    ) {
      return rejectWithValue('Faltan campos requeridos para actualizar la transacción');
    }

    console.log('🔄 updateTransaction thunk, id:', id, 'data:', data);
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, data);
    return transaction;
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/delete',
  async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
    return id;
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState: {
    list: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.list = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.error = null;
      })
      .addCase(addTransaction.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(addTransactions.fulfilled, (state, action) => {
        // Agrega todas las transacciones nuevas al principio de la lista
        state.list = [...action.payload, ...state.list];
        state.error = null;
      })
      .addCase(addTransactions.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const index = state.list.findIndex(tx => tx.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        state.error = null;
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.list = state.list.filter(tx => tx.id !== action.payload);
        state.error = null;
      });
  }
});

export default transactionsSlice.reducer;