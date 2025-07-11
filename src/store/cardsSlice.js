import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'cards';

// Async thunks
export const fetchCards = createAsyncThunk('cards/fetchCards', async () => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
});

export const addCard = createAsyncThunk('cards/addCard', async (cardData) => {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...cardData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  return {
    id: docRef.id,
    ...cardData
  };
});

export const updateCard = createAsyncThunk('cards/updateCard', async ({ id, ...cardData }) => {
  const cardRef = doc(db, COLLECTION, id);
  await updateDoc(cardRef, {
    ...cardData,
    updatedAt: new Date().toISOString()
  });
  
  return { id, ...cardData };
});

export const deleteCard = createAsyncThunk('cards/deleteCard', async (cardId) => {
  await deleteDoc(doc(db, COLLECTION, cardId));
  return cardId;
});

// Slice
const cardsSlice = createSlice({
  name: 'cards',
  initialState: {
    cards: [],
    loading: false,
    error: null,
    selectedCard: null
  },
  reducers: {
    setSelectedCard: (state, action) => {
      state.selectedCard = action.payload;
    },
    clearSelectedCard: (state) => {
      state.selectedCard = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch cards
      .addCase(fetchCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCards.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = action.payload;
      })
      .addCase(fetchCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Add card
      .addCase(addCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCard.fulfilled, (state, action) => {
        state.loading = false;
        state.cards.unshift(action.payload);
      })
      .addCase(addCard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Update card
      .addCase(updateCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCard.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.cards.findIndex(card => card.id === action.payload.id);
        if (index !== -1) {
          state.cards[index] = action.payload;
        }
      })
      .addCase(updateCard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Delete card
      .addCase(deleteCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCard.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = state.cards.filter(card => card.id !== action.payload);
      })
      .addCase(deleteCard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { setSelectedCard, clearSelectedCard, clearError } = cardsSlice.actions;
export default cardsSlice.reducer;

// Selectors
export const selectAllCards = (state) => state.cards.cards;
export const selectCreditCards = (state) => state.cards.cards.filter(card => card.type === 'credit');
export const selectDebitCards = (state) => state.cards.cards.filter(card => card.type === 'debit');
export const selectCardById = (state, cardId) => state.cards.cards.find(card => card.id === cardId);
export const selectCardsLoading = (state) => state.cards.loading;
export const selectCardsError = (state) => state.cards.error;