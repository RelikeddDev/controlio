import React, { useState } from 'react';
import { Layout, theme, Drawer } from 'antd';
import HeaderBar from './components/HeaderBar.jsx';
import SiderMenu from './components/SiderMenu.jsx';
import AppFooter from './components/AppFooter.jsx';
import TransactionModal from '../components/TransactionModal.jsx'; // Usa tu componente
import { Outlet } from 'react-router-dom';
import useIsMobile from '../hooks/useIsMobile';
import { PlusOutlined, DollarCircleFilled } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';

const { Content } = Layout;

const AppLayout = () => {
  const {
    token: { colorBgContainer, borderRadiusLG, colorBgLayout },
  } = theme.useToken();

  const isMobile = useIsMobile();

  // Drawer abierto/cerrado en móvil
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Para desktop, colapsado/expandido
  const [collapsed, setCollapsed] = useState(false);

  // Estado para mostrar el modal de transacción
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Obtén categorías y tarjetas desde Redux (ajusta los selectores según tu store)
  const categories = useSelector(state => state.categories.list || []);
  const cards = useSelector(state => state.cards.cards || []);

  // Acción para guardar la transacción (ajusta según tu lógica)
  const dispatch = useDispatch();
  const handleAddTransaction = (data) => {
    // Aquí despacha tu acción para guardar la transacción
    // dispatch(addTransaction(data));
    // O llama a tu función de guardado
    // Luego cierra el modal:
    setShowTransactionModal(false);
  };

  // Ajusta el ancho del Sider según el estado (colapsado o no)
  const siderWidth = !isMobile ? (collapsed ? 80 : 220) : 0;

  return (
    <Layout style={{ minHeight: '100vh', background: colorBgLayout }}>
      {/* Menú lateral fijo en desktop */}
      {!isMobile && (
        <SiderMenu collapsed={collapsed} setCollapsed={setCollapsed} />
      )}

      {/* Drawer en móvil */}
      {isMobile && (
        <Drawer
          title="Menú"
          placement="left"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          bodyStyle={{ padding: 0, background: colorBgContainer }}
        >
          <SiderMenu
            collapsed={false}
            setCollapsed={() => { }}
            isDrawer
            onMenuItemClick={() => setDrawerOpen(false)}
          />
        </Drawer>
      )}

      <Layout style={{ marginLeft: !isMobile ? siderWidth : 0 }}>
        <HeaderBar
          onMenuClick={() => isMobile && setDrawerOpen(true)}
          showMenuButton={isMobile}
        />

        <Content
          style={{
            margin: isMobile ? '8px 0 0' : '24px 16px 0',
            padding: isMobile ? 8 : 24,
            overflowY: 'auto',
            background: colorBgContainer,
            borderRadius: isMobile ? 0 : borderRadiusLG,
            boxShadow: isMobile ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Outlet />
        </Content>
        <AppFooter />
      </Layout>

      {/* FAB: Botón flotante para nueva transacción */}
      <button
        className="fab-btn"
        aria-label="Agregar transacción"
        title="Agregar transacción"
        onClick={() => setShowTransactionModal(true)}
      >
        <span className="fab-icon-group">
          <PlusOutlined className="fab-plus" />
           
          <DollarCircleFilled className="fab-transaction" />
        </span>
      </button>

      {/* Modal de captura de transacción */}
      <TransactionModal
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSubmit={handleAddTransaction}
        categories={categories}
        cards={cards}
        initialValues={null}
      />
    </Layout>
  );
};

export default AppLayout;