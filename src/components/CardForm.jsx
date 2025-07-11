import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Row,
  Col,
  Divider,
  Typography,
  Space,
  Alert
} from 'antd';
import { useDispatch } from 'react-redux';
import { addCard, updateCard } from '../store/cardsSlice';

const { Option } = Select;
const { Text } = Typography;

const CardForm = ({ visible, onCancel, card }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const isEditing = !!card;

  useEffect(() => {
    if (visible) {
      if (card) {
        form.setFieldsValue({
          ...card,
          color: card.color || '#1890ff',
          personalPaymentDay: card.personalPaymentDay ?? undefined, // Asegura que sea undefined si no existe
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          type: 'credit',
          color: '#1890ff',
          cutoffDay: 1,
          paymentDay: 15,
          personalPaymentDay: undefined
        });
      }
    }
  }, [visible, card, form]);

  const handleSubmit = async (values) => {
    try {
      const cardData = {
        ...values,
        color: typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || '#1890ff',
        createdAt: card?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Elimina campos undefined
      Object.keys(cardData).forEach(key => {
        if (cardData[key] === undefined) {
          delete cardData[key];
        }
      });

      if (isEditing) {
        await dispatch(updateCard({ id: card.id, ...cardData })).unwrap();
      } else {
        await dispatch(addCard(cardData)).unwrap();
      }

      form.resetFields();
      onCancel();
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  const cardTypeOptions = [
    { value: 'credit', label: 'Tarjeta de Crédito' },
    { value: 'debit', label: 'Tarjeta de Débito' },
  ];

  const bankOptions = [
    'BBVA',
    'Banamex',
    'Santander',
    'Banorte',
    'HSBC',
    'Scotiabank',
    'Inbursa',
    'Azteca',
    'Rappi',
    'Nu',
    'Hey Banco',
    'Otro'
  ];

  // Generar opciones de días (1-31)
  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Modal
      title={isEditing ? 'Editar Tarjeta' : 'Agregar Nueva Tarjeta'}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={isEditing ? 'Actualizar' : 'Agregar'}
      cancelText="Cancelar"
      width={600}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          type: 'credit',
          color: '#1890ff',
          cutoffDay: 1,
          paymentDay: 15,
          personalPaymentDay: undefined
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Nombre de la Tarjeta"
              rules={[{ required: true, message: 'Ingresa el nombre de la tarjeta' }]}
            >
              <Input placeholder="Ej: Tarjeta Rappi" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="type"
              label="Tipo de Tarjeta"
              rules={[{ required: true, message: 'Selecciona el tipo' }]}
            >
              <Select placeholder="Selecciona el tipo">
                {cardTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="bank"
              label="Banco/Institución"
              rules={[{ required: true, message: 'Selecciona el banco' }]}
            >
              <Select
                placeholder="Selecciona el banco"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {bankOptions.map(bank => (
                  <Option key={bank} value={bank}>
                    {bank}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastFourDigits"
              label="Últimos 4 Dígitos"
              rules={[
                { required: true, message: 'Ingresa los últimos 4 dígitos' },
                { len: 4, message: 'Deben ser exactamente 4 dígitos' }
              ]}
            >
              <Input placeholder="1234" maxLength={4} />
            </Form.Item>
          </Col>
        </Row>

        {/* Configuración específica para tarjetas de crédito */}
        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) =>
          prevValues.type !== currentValues.type
        }>
          {({ getFieldValue }) => {
            const cardType = getFieldValue('type');

            if (cardType === 'credit') {
              return (
                <>
                  <Divider orientation="left">
                    <Text strong>Configuración de Facturación</Text>
                  </Divider>

                  <Alert
                    message="Información importante"
                    description="Estos datos son necesarios para calcular automáticamente tus próximos pagos y fechas de corte."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="cutoffDay"
                        label="Día de Corte"
                        rules={[{ required: true, message: 'Selecciona el día de corte' }]}
                        tooltip="Día del mes en que se cierra tu estado de cuenta"
                      >
                        <Select placeholder="Día de corte">
                          {dayOptions.map(day => (
                            <Option key={day} value={day}>
                              Día {day}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="paymentDay"
                        label="Fecha Limite de Pago"
                        rules={[{ required: true, message: 'Selecciona la Fecha Limite de Pago' }]}
                        tooltip="Día del mes en que debes realizar el pago"
                      >
                        <Select placeholder="Fecha Limite de Pago">
                          {dayOptions.map(day => (
                            <Option key={day} value={day}>
                              Día {day}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* NUEVO: Día personal de pago */}
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        name="personalPaymentDay"
                        label="Tu día personal de pago (opcional)"
                        tooltip="Selecciona el día del mes en que acostumbras pagar esta tarjeta (quincena o fin de mes)"
                      >
                        <Select placeholder="Selecciona un día" allowClear>
                          <Option value={15}>Día 15 (Quincena)</Option>
                          <Option value={30}>Día 30 (Fin de mes)</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="creditLimit"
                        label="Límite de Crédito"
                        tooltip="Límite máximo de tu tarjeta (opcional)"
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          placeholder="0.00"
                          min={0}
                          step={100}
                          formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="annualFee"
                        label="Anualidad"
                        tooltip="Costo anual de la tarjeta (opcional)"
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          placeholder="0.00"
                          min={0}
                          step={50}
                          formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              );
            }
            return null;
          }}
        </Form.Item>

        <Divider orientation="left">
          <Text strong>Personalización</Text>
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="color"
              label="Color de Identificación"
              tooltip="Color para identificar fácilmente tu tarjeta"
            >
              <Input type="color" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="notes"
              label="Notas (Opcional)"
            >
              <Input.TextArea
                placeholder="Notas adicionales sobre esta tarjeta..."
                rows={3}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CardForm;