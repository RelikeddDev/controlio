import { useEffect, useState } from 'react';
import { PlusOutlined, RobotOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import RightAlignedButton from '../components/RightAlignedButton';
import TransactionModal from '../components/TransactionModal';
import TransactionTable from '../components/TransactionTable';
import AnalyzeReceiptModal from '../components/AnalyzeReceiptModal';
import TransactionReviewModal from '../components/TransactionReviewModal';


import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  fetchTransactions
} from '../store/transactionsSlice';

import { fetchCategories } from '../store/categoriesSlice';
import { fetchCards } from '../store/cardsSlice';

const TransactionManager = () => {
  const dispatch = useDispatch();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [analyzeModalOpen, setAnalyzeModalOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [transactionsToReview, setTransactionsToReview] = useState([]);


  const transactions = useSelector((state) => state.transactions.list);
  const { list: categories } = useSelector((state) => state.categories);
  const cards = useSelector((state) => state.cards.cards);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchTransactions());
    dispatch(fetchCards());
  }, [dispatch]);

  const handleSave = (data) => {
    if (data.id) {
      dispatch(updateTransaction(data));
    } else {
      dispatch(addTransaction(data));
    }
    setModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    dispatch(deleteTransaction(id));
  };

  const handleAnalyzeSubmit = (parsedTransactions) => {
    const safeTransactions = parsedTransactions.map(tx => ({
      amount: parseFloat(tx.amount) || 0,
      date: tx.date instanceof Date
        ? tx.date.toISOString()
        : new Date(tx.date || Date.now()).toISOString(),
      type: tx.type || 'expense',
      categoryId: tx.categoryId || null,
      deferred: tx.deferred || false,
      installments: tx.deferred ? tx.installments || 0 : null,
      firstPaymentDate: tx.deferred && tx.firstPaymentDate
        ? (tx.firstPaymentDate instanceof Date
          ? tx.firstPaymentDate.toISOString()
          : new Date(tx.firstPaymentDate).toISOString())
        : null,
      paidInstallments: tx.deferred ? tx.paidInstallments || 0 : undefined,
      cardId: tx.cardId || (tx.deferred ? null : 'cash'),
      description: tx.description || ''
    }));

    setTransactionsToReview(safeTransactions);
    setAnalyzeModalOpen(false);
    setReviewOpen(true);
  };

  const handleConfirmReview = () => {
    transactionsToReview.forEach(tx => {
      if (tx.amount && tx.date && tx.categoryId && tx.cardId) {
        dispatch(addTransaction(tx));
      }
    });
    setReviewOpen(false);
    setTransactionsToReview([]);
  };


  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        <RightAlignedButton icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Nueva transacción
        </RightAlignedButton>
        <RightAlignedButton icon={<RobotOutlined />} onClick={() => setAnalyzeModalOpen(true)}>
          Cargar imagen con IA
        </RightAlignedButton>
      </div>

      <TransactionTable
        transactions={transactions}
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TransactionModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTransaction(null);
        }}
        onSubmit={handleSave}
        categories={categories}
        initialValues={selectedTransaction}
        cards={cards}
      />

      <AnalyzeReceiptModal
        visible={analyzeModalOpen}
        onClose={() => setAnalyzeModalOpen(false)}
        onSubmit={handleAnalyzeSubmit}
        categories={categories}
        cards={cards}
      />
      <TransactionReviewModal
        visible={reviewOpen}
        transactions={transactionsToReview}
        onClose={() => setReviewOpen(false)}
        onConfirm={handleConfirmReview}
        categories={categories}
        cards={cards}
        setTransactions={setTransactionsToReview}
      />

    </div>
  );
};

export default TransactionManager;
