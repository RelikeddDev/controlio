import { Table, Tag, Space, Input, Button, Popconfirm, Modal, Descriptions } from 'antd';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { formatCurrency } from '../utils/formatters';
import { useSelector } from 'react-redux';

const TransactionTable = ({ transactions, categories = [], onEdit, onDelete }) => {
  const [searchText, setSearchText] = useState('');
  const [detailModal, setDetailModal] = useState({ visible: false, transaction: null });

  // Obtener tarjetas del store para mostrar nombre y últimos 4 dígitos
  const cards = useSelector(state => state.cards.cards || []);

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach(cat => {
      map[cat.id] = cat.name;
    });
    return map;
  }, [categories]);

  // Mapeo rápido de tarjetas por id
  const cardMap = useMemo(() => {
    const map = {};
    cards.forEach(card => {
      map[card.id] = card;
    });
    return map;
  }, [cards]);

  const filteredData = transactions.filter(tx =>
    tx.description?.toLowerCase().includes(searchText.toLowerCase()) ||
    categoryMap[tx.categoryId]?.toLowerCase().includes(searchText.toLowerCase())
  );

  const openDetailModal = (transaction) => {
    setDetailModal({ visible: true, transaction });
  };

  const closeDetailModal = () => {
    setDetailModal({ visible: false, transaction: null });
  };

  const calculateInstallmentStatus = (tx) => {
    const startDate = tx.firstPaymentDate ? dayjs(tx.firstPaymentDate) : dayjs(tx.date);
    const now = dayjs();
    const monthsPassed = now.diff(startDate, 'month') + 1;
    const currentPayment = Math.max(1, Math.min(monthsPassed, tx.installments));
    return `${currentPayment} de ${tx.installments}`;
  };

  const calculateDeferredDetails = (tx) => {
    const startDate = dayjs(tx.date);
    const monthlyPayment = tx.amount / tx.installments;
    const now = dayjs();
    const monthsPassed = now.diff(startDate, 'month') + 1;
    const currentPayment = Math.min(monthsPassed, tx.installments);
    const remainingPayments = tx.installments - currentPayment;
    const capitalRemaining = remainingPayments * monthlyPayment;
    const lastPaymentDate = startDate.add(tx.installments - 1, 'month');

    return {
      monthlyPayment: monthlyPayment.toFixed(2),
      currentPayment,
      remainingPayments,
      capitalRemaining: capitalRemaining.toFixed(2),
      lastPaymentDate: lastPaymentDate.format('DD/MM/YYYY'),
    };
  };

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
      render: date => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: type => (
        <Tag color={type === 'income' ? 'green' : 'red'}>
          {type === 'income' ? 'Ingreso' : 'Gasto'}
        </Tag>
      ),
      filters: [
        { text: 'Ingreso', value: 'income' },
        { text: 'Gasto', value: 'expense' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: amount => `$${amount.toFixed(2)}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Categoría',
      dataIndex: 'categoryId',
      key: 'categoryId',
      render: id => categoryMap[id] || 'Desconocida',
    },
    {
      title: 'Tarjeta',
      dataIndex: 'cardId',
      key: 'cardId',
      render: cardId => {
        if (cardId === 'cash') return <Tag color="gold">Efectivo</Tag>;
        const card = cardMap[cardId];
        if (!card) return <Tag color="default">Desconocida</Tag>;
        return (
          <Tag color={card.color || 'blue'}>
            {card.name} {card.lastFourDigits ? `*${card.lastFourDigits}` : ''}
          </Tag>
        );
      }
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Estado pago diferido',
      key: 'installmentsStatus',
      render: (_, tx) =>
        tx.deferred ? (
          <Button type="link" onClick={() => openDetailModal(tx)} style={{ padding: 0 }}>
            {calculateInstallmentStatus(tx)}
          </Button>
        ) : (
          '-'
        ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => onEdit(record)}>Editar</Button>
          <Popconfirm
            title="¿Seguro que deseas eliminar esta transacción?"
            onConfirm={() => onDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button danger size="small">Eliminar</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Input.Search
        placeholder="Buscar por descripción o categoría"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table
        dataSource={filteredData}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title="Detalle de transacción diferida"
        open={detailModal.visible}
        onCancel={closeDetailModal}
        footer={null}
      >
        {detailModal.transaction && (() => {
          const tx = detailModal.transaction;

          if (!tx.deferred || !tx.installments || tx.installments < 2) {
            return <p>Esta transacción no es una compra diferida a meses.</p>;
          }

          const details = calculateDeferredDetails(tx);

          return (
            <div style={{ paddingTop: 8 }}>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Descripción">{tx.description || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Fecha de inicio">{dayjs(tx.date).format('DD/MM/YYYY')}</Descriptions.Item>
                <Descriptions.Item label="Pagos totales">{tx.installments}</Descriptions.Item>
                <Descriptions.Item label="Pago actual">{details.currentPayment}</Descriptions.Item>
                <Descriptions.Item label="Pagos restantes">{details.remainingPayments}</Descriptions.Item>
                <Descriptions.Item label="Monto mensual">{formatCurrency(details.monthlyPayment)}</Descriptions.Item>
                <Descriptions.Item label="Capital restante">{formatCurrency(details.capitalRemaining)}</Descriptions.Item>
                <Descriptions.Item label="Fecha del último pago">{details.lastPaymentDate}</Descriptions.Item>
              </Descriptions>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default TransactionTable;