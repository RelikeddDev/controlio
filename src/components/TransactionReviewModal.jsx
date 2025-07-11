import React from 'react';
import { Modal, Table, Button, Tag, Typography, message } from 'antd';
import { useDispatch } from 'react-redux';
import { addTransaction } from '../store/transactionsSlice';

const { Text } = Typography;

const TransactionReviewModal = ({
  visible,
  onClose,
  onConfirm,
  transactions,
  categories,
  cards,
  setTransactions,
}) => {
  const dispatch = useDispatch();

  const getCategoryName = (id) => {
    const found = categories.find(c => c.id === id);
    return found ? found.name : <Text type="warning">No válida</Text>;
  };

  const getCardName = (id) => {
    if (id === 'cash') return 'Efectivo';
    const found = cards.find(c => c.id === id);
    return found ? found.name : <Text type="warning">No válida</Text>;
  };

  // Validación estricta de campos obligatorios, igual que TransactionModal
  const isValidTransaction = (tx) => {
    const baseFields =
      tx.type &&
      tx.amount &&
      tx.categoryId &&
      tx.date &&
      tx.cardId;

    // Si es compra diferida, también debe tener estos campos
    if (tx.deferred) {
      return (
        baseFields &&
        tx.installments &&
        tx.firstPaymentDate
      );
    }
    return baseFields;
  };

  const handleConfirm = () => {
    const validTransactions = transactions.filter(isValidTransaction);

    console.log('[TransactionReviewModal] Transacciones válidas a guardar:', validTransactions);

    if (validTransactions.length === 0) {
      message.error('Completa todos los campos obligatorios en las transacciones antes de guardar.');
      console.log('[TransactionReviewModal] No hay transacciones válidas para guardar.');
      return;
    }

    validTransactions.forEach((tx, idx) => {
      console.log(`[TransactionReviewModal] Guardando transacción #${idx + 1}:`, tx);
      dispatch(addTransaction(tx));
    });

    if (onConfirm) {
      console.log('[TransactionReviewModal] Llamando onConfirm con:', validTransactions);
      onConfirm(validTransactions);
    }

    console.log('[TransactionReviewModal] Guardado finalizado. Cerrando modal y limpiando transacciones.');
    onClose();
    setTransactions([]);
  };

  const columns = [
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (value) =>
        value ? `$${parseFloat(value).toFixed(2)}` : <Tag color="red">Falta</Tag>,
    },
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
      render: (value) =>
        value ? new Date(value).toLocaleDateString() : <Tag color="red">Falta</Tag>,
    },
    {
      title: 'Categoría',
      dataIndex: 'categoryId',
      key: 'categoryId',
      render: getCategoryName,
    },
    {
      title: 'Pago',
      dataIndex: 'cardId',
      key: 'cardId',
      render: getCardName,
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      render: (value) => value || <Text type="secondary">Sin descripción</Text>,
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title="Revisar transacciones detectadas"
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          Guardar transacciones válidas
        </Button>,
      ]}
      width={800}
    >
      <Table
        dataSource={transactions}
        columns={columns}
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowKey={(record) =>
          `${record.date}-${record.description}-${record.amount}`
        }
      />
    </Modal>
  );
};

export default TransactionReviewModal;