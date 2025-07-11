import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  addCardStart,
  addCardSuccess,
  addCardFailure,
  fetchStart,
  fetchSuccess,
  fetchFailure,
  updateCardStart,
  updateCardSuccess,
  updateCardFailure,
  deleteCardStart,
  deleteCardSuccess,
  deleteCardFailure,
} from './cardsSlice';

// Agregar tarjeta
export const addCard = (cardData) => async (dispatch) => {
  dispatch(addCardStart());

  try {
    // Aquí guardas toda la data enviada desde el formulario,
    // incluyendo name, bank, numberMasked, closingDate, paymentDate
    const docRef = await addDoc(collection(db, 'cards'), cardData);

    const cardWithId = { id: docRef.id, ...cardData };

    dispatch(addCardSuccess(cardWithId));
  } catch (error) {
    dispatch(addCardFailure(error.message));
  }
};

// Obtener tarjetas
export const fetchCards = () => async (dispatch) => {
  dispatch(fetchStart());
  try {
    const querySnapshot = await getDocs(collection(db, 'cards'));
    const cards = [];
    querySnapshot.forEach((doc) => {
      cards.push({ id: doc.id, ...doc.data() });
    });
    dispatch(fetchSuccess(cards));
  } catch (error) {
    dispatch(fetchFailure(error.message));
  }
};

// Actualizar tarjeta
export const updateCard = (card) => async (dispatch) => {
  dispatch(updateCardStart());
  try {
    // Actualizas el documento con toda la info de card,
    // que debe contener todas las propiedades que quieres guardar
    const ref = doc(db, 'cards', card.id);
    await updateDoc(ref, card);
    dispatch(updateCardSuccess(card));
  } catch (error) {
    dispatch(updateCardFailure(error.message));
  }
};

// Eliminar tarjeta
export const deleteCard = (id) => async (dispatch) => {
  dispatch(deleteCardStart());
  try {
    const ref = doc(db, 'cards', id);
    await deleteDoc(ref);
    dispatch(deleteCardSuccess(id));
  } catch (error) {
    dispatch(deleteCardFailure(error.message));
  }
};
