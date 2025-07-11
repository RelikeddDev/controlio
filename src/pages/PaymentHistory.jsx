import React, { useState, useMemo, useEffect } from 'react';
import { Card, Table, Tag, Typography, Space, Modal, DatePicker } from 'antd';
import { CreditCardOutlined, CalendarOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);
import { calculateNextPayment } from '../utils/cardPaymentCalculator';
import { formatCurrency } from '../utils/formatters';
import { fetchTransactions } from '../store/transactionsSlice';
import { fetchCards } from '../store/cardsSlice';

const { Title, Text } = Typography;

// Función para obtener el último periodo cerrado de una tarjeta
function getLastBillingPeriod(card) {
  const today = dayjs();
  const cutoff = card.cutoffDay;
  let end;
  if (today.date() >= cutoff) {
    end = today.date(cutoff);
  } else {
    end = today.subtract(1, 'month').date(cutoff);
  }
  const start = end.clone().add(1, 'day').subtract(1, 'month');
  return {
    start: start.startOf('day'),
    end: end.endOf('day'),
  };
}

// Suma los gastos del último periodo cerrado para una tarjeta
function getAmountForLastBillingPeriod(card, transactions) {
  const { start, end } = getLastBillingPeriod(card);
  return transactions
    .filter(
      (tx) =>
        tx.cardId === card.id &&
        dayjs(tx.date).isBetween(start, end, null, '[]') &&
        tx.type === 'expense'
    )
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
}

const PaymentHistory = () => {
  const dispatch = useDispatch();
  const { cards = [] } = useSelector((state) => state.cards);
  const transactions = useSelector((state) => state.transactions.list || []);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [selectedCardName, setSelectedCardName] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState({ start: '', end: '' });

  useEffect(() => {
    dispatch(fetchCards());
    dispatch(fetchTransactions());
  }, [dispatch]);

  useEffect(() => {
    console.log('Transacciones en PaymentHistory:', transactions);
  }, [transactions]);

  // Calcula los pagos de cada tarjeta para el mes seleccionado
  const payments = useMemo(() => {
    if (!cards.length || !transactions.length) return [];
    return cards
      .filter((card) => card.type === 'credit')
      .map((card) => {
        const baseDate = selectedMonth.endOf('month');
        const paymentInfo = calculateNextPayment(
          card,
          transactions.filter((t) => t.cardId === card.id),
          baseDate
        );
        return {
          cardId: card.id,
          cardName: card.name,
          personalPaymentDay: card.personalPaymentDay,
          ...paymentInfo,
        };
      })
      .sort((a, b) => (a.personalPaymentDay || 0) - (b.personalPaymentDay || 0));
  }, [cards, transactions, selectedMonth]);

  // NUEVO: Suma los pagos realizados en el último periodo cerrado, agrupados por día personal de pago
  const getTotalPaidByPersonalDay = (day) => {
    const cardsWithDay = cards.filter((card) => card.personalPaymentDay === day);
    return cardsWithDay.reduce(
      (sum, card) => sum + getAmountForLastBillingPeriod(card, transactions),
      0
    );
  };

  const handleShowTransactions = (record) => {
    setSelectedTransactions([
      ...(record.periodTransactions || []),
      ...(record.recurringTransactions || []),
      ...(record.msiPaymentsThisPeriod || []),
    ]);
    setSelectedCardName(record.cardName);
    setSelectedPeriod(record.billingPeriod);
    setDetailModalVisible(true);
  };

  const paymentColumns = [
    {
      title: 'Tarjeta',
      dataIndex: 'cardName',
      key: 'cardName',
      render: (text) => (
        <Space>
          <CreditCardOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Día personal de pago',
      dataIndex: 'personalPaymentDay',
      key: 'personalPaymentDay',
      render: (day) => <Tag color="geekblue">{day ? `Día ${day}` : 'No asignado'}</Tag>,
      sorter: (a, b) => (a.personalPaymentDay || 0) - (b.personalPaymentDay || 0),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Período de Facturación',
      key: 'billingPeriod',
      render: (_, record) => (
        <Text type="secondary">
          {record.billingPeriod.start} - {record.billingPeriod.end}
        </Text>
      ),
    },
    {
      title: 'Fecha limite de Pago',
      dataIndex: 'paymentDateFormatted',
      key: 'paymentDate',
    },
    {
      title: 'Monto a Pagar',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => (
        <Text strong style={{ color: amount > 0 ? '#ff4d4f' : '#52c41a' }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Transacciones',
      dataIndex: 'transactionsCount',
      key: 'transactionsCount',
      render: (count, record) => (
        <Tag
          color="blue"
          style={{ cursor: 'pointer' }}
          onClick={() => handleShowTransactions(record)}
        >
          {count} transacciones
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Historial de Pagos
            </Title>
          </Space>
        }
        extra={
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={setSelectedMonth}
            allowClear={false}
            style={{ minWidth: 140 }}
          />
        }
        style={{ marginBottom: 24 }}
      >
        <Title level={5} style={{ marginBottom: 0, color: '#1677ff' }}>
          Pagos realizados por día personal de pago
        </Title>
        <Space style={{ marginBottom: 16 }}>
          <Text strong>Total pagado el día 15: </Text>
          <Text style={{ color: getTotalPaidByPersonalDay(15) > 0 ? '#52c41a' : '#aaa' }}>
            {formatCurrency(getTotalPaidByPersonalDay(15))}
          </Text>
          <Text strong>Total pagado el día 30: </Text>
          <Text style={{ color: getTotalPaidByPersonalDay(30) > 0 ? '#52c41a' : '#aaa' }}>
            {formatCurrency(getTotalPaidByPersonalDay(30))}
          </Text>
        </Space>
        <Table
          columns={paymentColumns}
          dataSource={payments}
          rowKey="cardId"
          pagination={false}
          size="middle"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Modal de detalle de transacciones */}
      <Modal
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        title={`Transacciones de ${selectedCardName} (${selectedPeriod.start} - ${selectedPeriod.end})`}
        footer={null}
        width={700}
      >
        <Table
          dataSource={selectedTransactions}
          scroll={{ x: 'max-content' }}
          rowKey={(row) => row.id + (row.isMSI ? `-msi-${row.msiMonth}` : '')}
          columns={[
            {
              title: 'Fecha',
              dataIndex: 'date',
              key: 'date',
              render: (d, row) =>
                row.isMSI
                  ? dayjs(row.paymentDue).format('DD/MM/YYYY')
                  : dayjs(d).format('DD/MM/YYYY'),
            },
            { title: 'Descripción', dataIndex: 'description', key: 'description' },
            {
              title: 'Monto',
              dataIndex: 'amount',
              key: 'amount',
              render: (a) => formatCurrency(a),
            },
            {
              title: 'Tipo',
              dataIndex: 'type',
              key: 'type',
              render: (t, row) =>
                row.isMSI ? 'MSI' : t === 'expense' ? 'Gasto' : 'Ingreso',
            },
            {
              title: 'Recurrente',
              dataIndex: 'recurring',
              key: 'recurring',
              render: (r, row) =>
                row.isMSI ? `MSI ${row.msiMonth}/${row.msiTotal}` : r ? 'Sí' : 'No',
            },
            {
              title: 'Diferido',
              dataIndex: 'deferred',
              key: 'deferred',
              render: (d, row) => (row.isMSI ? 'Sí' : d ? 'Sí' : 'No'),
            },
          ]}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default PaymentHistory;