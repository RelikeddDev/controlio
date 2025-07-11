// src/components/CategoryForm.jsx
import React, { useEffect } from "react";
import { Form, Input, Button, Select } from "antd";

const CategoryForm = ({ initialValues, onSubmit, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues]);

  const handleFinish = (values) => {
    onSubmit(values);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item name="name" label="Nombre de la categoría" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item name="type" label="Tipo" rules={[{ required: true }]}>
        <Select>
          <Select.Option value="Gasto">Gasto</Select.Option>
          <Select.Option value="Ingreso">Ingreso</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="color" label="Color (hex)" rules={[{ required: true }]}>
        <Input type="color" />
      </Form.Item>

      <Button htmlType="submit" type="primary" loading={loading}>
        {initialValues ? "Actualizar" : "Crear"}
      </Button>
    </Form>
  );
};

export default CategoryForm;
