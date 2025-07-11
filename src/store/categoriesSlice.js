import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'categories';

// 🔄 Obtener todas las categorías
export const fetchCategories = createAsyncThunk(
  'categories/fetch',
  async () => {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
);

// ➕ Agregar nueva categoría
export const addCategory = createAsyncThunk(
  'categories/add',
  async (category) => {
    const docRef = await addDoc(collection(db, COLLECTION), category);
    return { id: docRef.id, ...category };
  }
);

// ✏️ Actualizar categoría existente
export const updateCategory = createAsyncThunk(
  'categories/update',
  async (category) => {
    const { id, ...data } = category;
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, data);
    return category;
  }
);

// ❌ Eliminar categoría
export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
    return id;
  }
);

// 🧩 Slice
const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    list: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.list = action.payload;
        state.loading = false;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add
      .addCase(addCategory.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })

      // Update
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.list.findIndex(cat => cat.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })

      // Delete
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.list = state.list.filter(cat => cat.id !== action.payload);
      });
  }
});

export default categoriesSlice.reducer;
