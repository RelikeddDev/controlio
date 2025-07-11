import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Typography,
  Space,
  Alert,
  Statistic,
  Progress,
  Modal
} from 'antd';
import {
  PlusOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCards } from '../store/cardsSlice';
import { fetchTransactions } from '../store/transactionsSlice';
import CardForm from '../components/CardForm';
import { formatCurrency } from '../utils/formatters';
import { getAllUpcomingPayments, getTotalToPayOnPersonalDay } from '../utils/cardPaymentCalculator';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);
const { Title, Text } = Typography;

// Devuelve el periodo de corte que acaba de cerrar para una tarjeta
function getLastBillingPeriod(card) {
  const today = dayjs();
  let cutoff = card.cutoffDay;
  let end;
  if (today.date() >= cutoff) {
    end = today.date(cutoff);
  } else {
    end = today.subtract(1, 'month').date(cutoff);
  }
  let start = end.clone().add(1, 'day').subtract(1, 'month');
  return {
    start: start.startOf('day'),
    end: end.endOf('day')
  };
}

// Suma los movimientos del periodo de corte que acaba de cerrar
function getAmountForLastBillingPeriod(card, transactions) {
  const { start, end } = getLastBillingPeriod(card);
  return transactions
    .filter(tx =>
      tx.cardId === card.id &&
      dayjs(tx.date).isBetween(start, end, null, '[]') &&
      tx.type === 'expense'
    )
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
}

const Cards = () => {
  const dispatch = useDispatch();
  const { cards = [], loading } = useSelector(state => state.cards);
  const transactions = useSelector(state => state.transactions.list || []);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [upcomingPayments, setUpcomingPayments] = useState([]);

  // Modal de detalle de transacciones
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [selectedCardName, setSelectedCardName] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState({ start: '', end: '' });

  useEffect(() => {
    dispatch(fetchCards());
    dispatch(fetchTransactions());
  }, [dispatch]);

  useEffect(() => {
    if ((cards?.length ?? 0) > 0 && (transactions?.length ?? 0) > 0) {
      const payments = getAllUpcomingPayments(cards, transactions);
      setUpcomingPayments(payments);
    }
  }, [cards, transactions]);

  const handleAddCard = () => {
    setEditingCard(null);
    setModalVisible(true);
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setModalVisible(true);
  };

  // Totales por día de pago personal (usando la función robusta de utilidades)
  const totalToPay15 = getTotalToPayOnPersonalDay(cards, transactions, 15);
  const totalToPay30 = getTotalToPayOnPersonalDay(cards, transactions, 30);

  const urgentPayments = upcomingPayments.filter(p => p.daysUntilPayment <= 7);

  const getPaymentStatusColor = (daysUntilPayment) => {
    if (daysUntilPayment == null) return 'default';
    if (daysUntilPayment < 0) return 'error';
    if (daysUntilPayment <= 3) return 'error';
    if (daysUntilPayment <= 7) return 'warning';
    return 'success';
  };

  const getPaymentStatusText = (daysUntilPayment) => {
    if (daysUntilPayment == null) return '-';
    if (daysUntilPayment < 0) return 'VENCIDO';
    if (daysUntilPayment === 0) return 'HOY';
    if (daysUntilPayment === 1) return 'MAÑANA';
    return `${daysUntilPayment} DÍAS`;
  };

  // Handler para mostrar el modal de detalle de transacciones
  const handleShowTransactions = (record) => {
    setSelectedTransactions([
      ...(record.periodTransactions || []),
      ...(record.recurringTransactions || []),
      ...(record.msiPaymentsThisPeriod || [])
    ]);
    setSelectedCardName(record.cardName);
    setSelectedPeriod(record.billingPeriod);
    setDetailModalVisible(true);
  };

  // Columnas para la tabla de próximos pagos
  const paymentColumns = [
    {
      title: 'Tarjeta',
      dataIndex: 'cardName',
      key: 'cardName',
      render: (text, record) => (
        <Space>
          <CreditCardOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
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
      title: 'Fecha límite de pago',
      dataIndex: 'paymentDateFormatted',
      key: 'paymentDate',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text>{text}</Text>
          <Tag color={getPaymentStatusColor(record.daysUntilPayment)}>
            {getPaymentStatusText(record.daysUntilPayment)}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Fecha personal de pago',
      key: 'personalPaymentDate',
      render: (_, record) => {
        const card = cards.find(c => c.id === record.cardId);
        if (!card || card.type !== 'credit' || !card.personalPaymentDay) {
          return <Text type="secondary">-</Text>;
        }
        // Calcula la próxima fecha personalizada de pago
        const today = dayjs();
        let year = today.year();
        let month = today.month();
        if (today.date() >= card.personalPaymentDay) {
          month += 1;
          if (month > 11) {
            month = 0;
            year += 1;
          }
        }
        const daysInMonth = dayjs(`${year}-${month + 1}-01`).daysInMonth();
        const realDay = Math.min(card.personalPaymentDay, daysInMonth);
        const nextPersonalDate = dayjs(`${year}-${month + 1}-${realDay}`);
        const daysLeft = nextPersonalDate.diff(today, 'day');

        return (
          <Space direction="vertical" size={0}>
            <Text>
              Día <b>{card.personalPaymentDay}</b> ({nextPersonalDate.format('DD/MM/YYYY')})
            </Text>
            <Tag color={daysLeft < 0 ? 'error' : daysLeft <= 3 ? 'error' : daysLeft <= 7 ? 'warning' : 'success'}>
              {daysLeft < 0
                ? 'VENCIDO'
                : daysLeft === 0
                  ? 'HOY'
                  : daysLeft === 1
                    ? 'MAÑANA'
                    : `${daysLeft} DÍAS`}
            </Tag>
          </Space>
        );
      }
    }, {
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
      {/* Header con estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Statistic
            title="Total a Pagar el 15"
            value={totalToPay15}
            formatter={formatCurrency}
            valueStyle={{ color: totalToPay15 > 0 ? '#ff4d4f' : '#52c41a' }}
            prefix={<DollarOutlined />}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Total a Pagar el 30"
            value={totalToPay30}
            formatter={formatCurrency}
            valueStyle={{ color: totalToPay30 > 0 ? '#ff4d4f' : '#52c41a' }}
            prefix={<DollarOutlined />}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Tarjetas Activas"
            value={cards.length}
            prefix={<CreditCardOutlined />}
          />
        </Col>
      </Row>

      {/* Alertas de pagos urgentes */}
      {urgentPayments.length > 0 && (
        <Alert
          message="¡Tienes pagos urgentes!"
          description={`${urgentPayments.length} tarjeta(s) tienen pagos en los próximos 7 días.`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Próximos Pagos */}
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <Title level={4} style={{ margin: 0 }}>Próximos Pagos</Title>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={paymentColumns}
          dataSource={upcomingPayments}
          rowKey="cardId"
          loading={loading}
          pagination={false}
          size="middle"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Gestión de Tarjetas */}
      <Card
        title={
          <Space>
            <CreditCardOutlined />
            <Title level={4} style={{ margin: 0 }}>Mis Tarjetas</Title>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddCard}
          >
            Agregar Tarjeta
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          {cards.map(card => {
            const paymentInfo = upcomingPayments.find(p => p.cardId === card.id);
            return (
              <Col xs={24} sm={12} lg={8} key={card.id}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => handleEditCard(card)}
                  style={{
                    borderLeft: `4px solid ${card.color || '#1890ff'}`,
                    cursor: 'pointer'
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong>{card.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Terminación: **** {card.lastFourDigits}
                        </Text>
                      </div>
                      <Tag color={card.type === 'credit' ? 'red' : 'blue'}>
                        {card.type === 'credit' ? 'Crédito' : 'Débito'}
                      </Tag>
                    </div>

                    {card.type === 'credit' && paymentInfo && (
                      <>
                        <div>
                          <Text type="secondary">Próximo pago: </Text>
                          <Text strong>{paymentInfo.paymentDateFormatted}</Text>
                        </div>
                        <div>
                          <Text type="secondary">Monto: </Text>
                          <Text strong style={{ color: '#ff4d4f' }}>
                            {formatCurrency(paymentInfo.totalAmount)}
                          </Text>
                        </div>
                        <Progress
                          percent={Math.max(0, Math.min(100, (30 - paymentInfo.daysUntilPayment) * 3.33))}
                          size="small"
                          status={paymentInfo.daysUntilPayment <= 3 ? 'exception' : 'normal'}
                          showInfo={false}
                        />
                      </>
                    )}

                    {/* Día personal de pago */}
                    {card.type === 'credit' && card.personalPaymentDay && (
                      <div>
                        <Text type="secondary">
                          Día personal de pago: <b>{card.personalPaymentDay}</b>
                        </Text>
                      </div>
                    )}

                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {card.type === 'credit' && (
                        <Text type="secondary">
                          Corte: {card.cutoffDay} | Límite de Pago: {card.paymentDay}
                        </Text>
                      )}
                    </div>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* Modal para agregar/editar tarjeta */}
      <CardForm
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        card={editingCard}
      />

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
          rowKey={(row) => row.id + (row.isMSI ? `-msi-${row.msiMonth}` : '')}
          columns={[
            {
              title: 'Fecha',
              dataIndex: 'date',
              key: 'date',
              render: (d, row) =>
                row.isMSI
                  ? dayjs(row.paymentDue).format('DD/MM/YYYY')
                  : dayjs(d).format('DD/MM/YYYY')
            },
            { title: 'Descripción', dataIndex: 'description', key: 'description' },
            {
              title: 'Monto',
              dataIndex: 'amount',
              key: 'amount',
              render: (a) => formatCurrency(a)
            },
            {
              title: 'Tipo',
              dataIndex: 'type',
              key: 'type',
              render: (t, row) =>
                row.isMSI ? 'MSI' : t === 'expense' ? 'Gasto' : 'Ingreso'
            },
            {
              title: 'Recurrente',
              dataIndex: 'recurring',
              key: 'recurring',
              render: (r, row) =>
                row.isMSI
                  ? `MSI ${row.msiMonth}/${row.msiTotal}`
                  : r
                    ? 'Sí'
                    : 'No'
            },
            {
              title: 'Diferido',
              dataIndex: 'deferred',
              key: 'deferred',
              render: (d, row) =>
                row.isMSI ? 'Sí' : d ? 'Sí' : 'No'
            }
          ]}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Modal>
    </div>
  );
};

export default Cards;