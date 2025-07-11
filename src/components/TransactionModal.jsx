import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Checkbox
} from 'antd';
import { useEffect } from 'react';
import dayjs from 'dayjs';

const { Option } = Select;

const TransactionModal = ({
  visible,
  onClose,
  onSubmit,
  categories = [],
  cards = [],
  initialValues
}) => {
  const [form] = Form.useForm();
  const deferred = Form.useWatch('deferred', form);
  const recurring = Form.useWatch('recurring', form);

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        type: 'expense',
        deferred: false,
        recurring: false,
        cardId: 'cash', // Valor por defecto
        ...initialValues,
        date: initialValues?.date ? dayjs(initialValues.date) : dayjs(),
        firstPaymentDate: initialValues?.firstPaymentDate
          ? dayjs(initialValues.firstPaymentDate)
          : null,
        installments: initialValues?.installments || null,
        paidInstallments: initialValues?.paidInstallments || 0,
        recurringInterval: initialValues?.recurringInterval || 'monthly',
        recurringStartDate: initialValues?.recurringStartDate
          ? dayjs(initialValues.recurringStartDate)
          : dayjs(),
        recurringEndDate: initialValues?.recurringEndDate
          ? dayjs(initialValues.recurringEndDate)
          : null,
      });
    }
  }, [visible, initialValues, form]);

  // Elimina los campos diferidos si se desactiva el checkbox
  useEffect(() => {
    if (!deferred) {
      form.resetFields(['installments', 'firstPaymentDate', 'paidInstallments']);
    }
  }, [deferred, form]);

  // Elimina los campos recurrentes si se desactiva el checkbox
  useEffect(() => {
    if (!recurring) {
      form.resetFields(['recurringInterval', 'recurringStartDate', 'recurringEndDate']);
    }
  }, [recurring, form]);

  const handleFinish = (values) => {
    const formatted = {
      ...values,
      date: values.date.toISOString(),
      ...(values.firstPaymentDate && {
        firstPaymentDate: values.firstPaymentDate.toISOString()
      }),
      ...(values.recurringStartDate && {
        recurringStartDate: values.recurringStartDate.toISOString()
      }),
      ...(values.recurringEndDate && {
        recurringEndDate: values.recurringEndDate.toISOString()
      }),
    };

    if (initialValues?.id) {
      formatted.id = initialValues.id;
    }

    // Si NO es compra diferida, elimina los campos MSI del objeto
    if (!values.deferred) {
      delete formatted.installments;
      delete formatted.firstPaymentDate;
      delete formatted.paidInstallments;
    }

    // Si NO es recurrente, elimina los campos recurrentes del objeto
    if (!values.recurring) {
      delete formatted.recurringInterval;
      delete formatted.recurringStartDate;
      delete formatted.recurringEndDate;
    }

    // Elimina campos undefined para evitar errores de Firestore
    Object.keys(formatted).forEach(key => {
      if (formatted[key] === undefined) {
        delete formatted[key];
      }
    });

    onSubmit(formatted);
    form.resetFields();
    onClose();
  };

  // Filtrar tarjetas de crédito para compras diferidas
  const availableCards = deferred 
    ? cards.filter(card => card.type === 'credit')
    : cards;

  return (
    <Modal
      title={initialValues ? 'Editar transacción' : 'Nueva transacción'}
      open={visible}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="type" label="Tipo" rules={[{ required: true }]}>
          <Select>
            <Option value="expense">Gasto</Option>
            <Option value="income">Ingreso</Option>
          </Select>
        </Form.Item>

        <Form.Item name="amount" label="Monto" rules={[{ required: true }]}>
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder="Ej. 200.00"
            prefix="$"
          />
        </Form.Item>

        <Form.Item name="categoryId" label="Categoría" rules={[{ required: true }]}>
          <Select placeholder="Selecciona una categoría">
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="date" label="Fecha" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="deferred" valuePropName="checked">
          <Checkbox>¿Compra diferida?</Checkbox>
        </Form.Item>

        {deferred && (
          <>
            <Form.Item
              name="installments"
              label="Meses sin intereses"
              rules={[{ required: true, message: 'Selecciona el plazo' }]}
            >
              <Select placeholder="Selecciona el plazo">
                {[3, 6, 12, 18, 24].map((n) => (
                  <Option key={n} value={n}>
                    {n} meses
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="firstPaymentDate"
              label="Fecha del primer pago"
              rules={[{ required: true, message: 'Selecciona la fecha del primer pago' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}

        <Form.Item name="recurring" valuePropName="checked">
          <Checkbox>¿Gasto recurrente? (ej. suscripción)</Checkbox>
        </Form.Item>

        {recurring && (
          <>
            <Form.Item
              name="recurringInterval"
              label="Frecuencia"
              rules={[{ required: true, message: 'Selecciona la frecuencia' }]}
            >
              <Select placeholder="Selecciona la frecuencia">
                <Option value="monthly">Mensual</Option>
                {/* Puedes agregar más opciones en el futuro */}
              </Select>
            </Form.Item>

            <Form.Item
              name="recurringStartDate"
              label="Fecha de inicio"
              rules={[{ required: true, message: 'Selecciona la fecha de inicio' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="recurringEndDate"
              label="Fecha de fin (opcional)"
              help="Deja vacío si es indefinido"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}

        <Form.Item
          name="cardId"
          label="Método de pago"
          rules={[{ required: true, message: 'Selecciona un método de pago' }]}
        >
          <Select placeholder="Selecciona una tarjeta o efectivo">
            {!deferred && <Option value="cash">Efectivo</Option>}
            {availableCards.map((card) => (
              <Option key={card.id} value={card.id}>
                {card.name} ({card.bank}) - *{card.lastFourDigits}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="description" label="Descripción">
          <Input.TextArea rows={3} placeholder="Descripción opcional" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Guardar transacción
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TransactionModal;