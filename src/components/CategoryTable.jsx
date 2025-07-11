// src/components/CategoryTable.jsx
import { Table, Button, Tag, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const CategoryTable = ({ categories, onEdit, onDelete }) => {
  const columns = [
    {
      title: "Nombre",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Tipo",
      dataIndex: "type",
      render: (type) => <Tag color={type === "Gasto" ? "red" : "green"}>{type}</Tag>,
      filters: [
        { text: "Gasto", value: "Gasto" },
        { text: "Ingreso", value: "Ingreso" },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: "Color",
      dataIndex: "color",
      render: (color) => <div style={{ width: 24, height: 24, backgroundColor: color, borderRadius: 4 }} />,
    },
    {
      title: "Acciones",
      render: (_, record) => (
        <>
          <Button icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Popconfirm
            title="¿Eliminar categoría?"
            onConfirm={() => onDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger style={{ marginLeft: 8 }} />
          </Popconfirm>
        </>
      ),
    },
  ];

  return <Table rowKey="id" dataSource={categories} columns={columns} scroll={{ x: 'max-content' }} />;
};

export default CategoryTable;
