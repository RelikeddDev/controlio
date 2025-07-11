// src/pages/Categories.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Modal, Button } from "antd";
import CategoryTable from "../components/CategoryTable";
import CategoryForm from "../components/CategoryForm";
import {
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../store/categoriesSlice";

const Categories = () => {
  const dispatch = useDispatch();
  const { list: categories, loading } = useSelector((state) => state.categories);

  const [isModalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleCreate = () => {
    setSelected(null);
    setModalOpen(true);
  };

  const handleSubmit = (values) => {
    if (selected) {
      dispatch(updateCategory({ ...selected, ...values }));
    } else {
      dispatch(addCategory(values));
    }
    setModalOpen(false);
  };

  const handleEdit = (category) => {
    setSelected(category);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    dispatch(deleteCategory(id));
  };

  return (
    <Card title="Categorías" extra={<Button onClick={handleCreate}>Nueva Categoría</Button>}>
      <CategoryTable
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <Modal
        open={isModalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destreyedOnClose
      >
        <CategoryForm
          initialValues={selected}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </Modal>
    </Card>
  );
};

export default Categories;
