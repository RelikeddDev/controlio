import {
  Modal,
  Upload,
  Button,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Spin,
  message,
  Checkbox,
  Divider,
  Collapse
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import dayjs from 'dayjs';

const { Option } = Select;
const { Panel } = Collapse;
const MAX_FILE_SIZE_MB = 2;

const AnalyzeReceiptModal = ({ visible, onClose, onSubmit, categories, cards }) => {
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const [form] = Form.useForm();

  const handleUpload = (file) => {
    if (!file.type.startsWith('image/')) {
      message.error('Solo puedes subir archivos de imagen.');
      return Upload.LIST_IGNORE;
    }

    if (file.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
      message.error(`La imagen debe ser menor a ${MAX_FILE_SIZE_MB}MB.`);
      return Upload.LIST_IGNORE;
    }

    const reader = new FileReader();
    reader.onload = (e) => setImageBase64(e.target.result.split(',')[1]);
    reader.readAsDataURL(file);

    return false;
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return message.error('Primero selecciona una imagen.');

    setLoading(true);
    try {
      const res = await fetch('https://us-central1-controlio-8e0e2.cloudfunctions.net/analyzeReceipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!res.ok) throw new Error('Error al analizar la imagen');

      const { transactions } = await res.json();

      if (!transactions?.length) {
        message.warning('No se detectó ninguna transacción.');
        return;
      }

      setTransactions(
        transactions.map((tx, index) => ({
          ...tx,
          key: index,
          type: tx.type || 'expense',
          date: tx.date ? dayjs(tx.date) : dayjs(),
          deferred: tx.deferred || false,
          installments: tx.installments || null,
          firstPaymentDate: tx.firstPaymentDate ? dayjs(tx.firstPaymentDate) : null,
          paidInstallments: tx.paidInstallments || 0
        }))
      );

      message.success('Análisis completado. Revisa y guarda las transacciones.');
    } catch (error) {
      console.error(error);
      message.error('Error al analizar la imagen.');
    } finally {
      setLoading(false);
    }
  };

  // Validación estricta de campos obligatorios, igual que TransactionModal
  const isValidTransaction = (tx) => {
    const baseFields =
      tx.type &&
      tx.amount &&
      tx.category &&
      tx.date &&
      tx.card;
    if (tx.deferred) {
      return (
        baseFields &&
        tx.installments &&
        tx.firstPaymentDate
      );
    }
    return baseFields;
  };

  const handleFinish = () => {
    // Solo envía las transacciones válidas
    const validTransactions = transactions.filter(isValidTransaction).map((tx) => ({
      ...tx,
      amount: parseFloat(tx.amount),
      date: tx.date.toISOString(),
      firstPaymentDate: tx.firstPaymentDate?.toISOString?.(),
      categoryId: categories.find((c) => c.name === tx.category)?.id,
      cardId:
        tx.card === 'efectivo'
          ? 'cash'
          : cards.find((c) => c.name === tx.card)?.id,
    }));

    if (validTransactions.length === 0) {
      message.error('Completa todos los campos obligatorios en las transacciones.');
      return;
    }

    onSubmit(validTransactions);
    setTransactions([]);
    setImageBase64(null);
    onClose();
  };

  const updateTransactionField = (index, field, value) => {
    const updated = [...transactions];
    updated[index][field] = value;
    setTransactions(updated);
  };

  return (
    <Modal
      open={visible}
      title="Analizar recibo con IA"
      onCancel={() => {
        form.resetFields();
        setTransactions([]);
        setImageBase64(null);
        onClose();
      }}
      footer={null}
      width={800}
    >
      <Upload
        beforeUpload={handleUpload}
        maxCount={1}
        accept="image/*"
        showUploadList={{ showRemoveIcon: true }}
      >
        <Button icon={<UploadOutlined />}>Seleccionar imagen</Button>
      </Upload>

      <Button
        onClick={handleAnalyze}
        disabled={!imageBase64}
        loading={loading}
        style={{ marginTop: 16 }}
      >
        Analizar imagen
      </Button>

      <Spin spinning={loading}>
        {transactions.length > 0 && (
          <>
            <Divider>Transacciones detectadas</Divider>
            <Form form={form} layout="vertical" onFinish={handleFinish}>
              <Collapse accordion>
                {transactions.map((tx, idx) => (
                  <Panel header={`Transacción ${idx + 1}`} key={idx}>
                    <Form.Item label="Tipo" required>
                      <Select
                        value={tx.type}
                        onChange={(val) => updateTransactionField(idx, 'type', val)}
                      >
                        <Option value="expense">Gasto</Option>
                        <Option value="income">Ingreso</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="Monto" required>
                      <InputNumber
                        prefix="$"
                        value={tx.amount}
                        onChange={(val) => updateTransactionField(idx, 'amount', val)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label="Fecha" required>
                      <DatePicker
                        value={tx.date}
                        onChange={(val) => updateTransactionField(idx, 'date', val)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label="Descripción">
                      <Input
                        value={tx.description}
                        onChange={(e) =>
                          updateTransactionField(idx, 'description', e.target.value)
                        }
                      />
                    </Form.Item>
                    <Form.Item label="Categoría" required>
                      <Select
                        value={tx.category}
                        onChange={(val) => updateTransactionField(idx, 'category', val)}
                      >
                        {categories.map((c) => (
                          <Option key={c.id} value={c.name}>
                            {c.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item label="Método de pago" required>
                      <Select
                        value={tx.card}
                        onChange={(val) => updateTransactionField(idx, 'card', val)}
                      >
                        <Option value="efectivo">Efectivo</Option>
                        {cards.map((c) => (
                          <Option key={c.id} value={c.name}>
                            {c.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item>
                      <Checkbox
                        checked={tx.deferred}
                        onChange={(e) =>
                          updateTransactionField(idx, 'deferred', e.target.checked)
                        }
                      >
                        ¿Compra diferida?
                      </Checkbox>
                    </Form.Item>
                    {tx.deferred && (
                      <>
                        <Form.Item label="Meses sin intereses" required>
                          <Select
                            value={tx.installments}
                            onChange={(val) =>
                              updateTransactionField(idx, 'installments', val)
                            }
                          >
                            {[3, 6, 12, 18, 24].map((n) => (
                              <Option key={n} value={n}>
                                {n} meses
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item label="Fecha del primer pago" required>
                          <DatePicker
                            value={tx.firstPaymentDate}
                            onChange={(val) =>
                              updateTransactionField(idx, 'firstPaymentDate', val)
                            }
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </>
                    )}
                  </Panel>
                ))}
              </Collapse>
              <Form.Item style={{ marginTop: 24 }}>
                <Button type="primary" htmlType="submit" block>
                  Guardar transacciones
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default AnalyzeReceiptModal;