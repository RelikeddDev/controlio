import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  DollarCircleOutlined,
  ShoppingOutlined,
  WalletOutlined,
  BarChartOutlined,
  HistoryOutlined,
  CreditCardOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;

const SiderMenu = ({
  collapsed,
  setCollapsed,
  isDrawer = false,
  onMenuItemClick, // <-- nombre más claro
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: 'Dashboard' },
    { key: '/transactions', icon: <DollarCircleOutlined />, label: 'Transacciones' },
    { key: '/categories', icon: <ShoppingOutlined />, label: 'Categorías' },
    { key: '/budgets', icon: <WalletOutlined />, label: 'Presupuestos' },
    { key: '/statistics', icon: <BarChartOutlined />, label: 'Estadísticas' },
    { key: '/historial', icon: <HistoryOutlined />, label: 'Historial de pagos' },
    { key: '/cards', icon: <CreditCardOutlined />, label: 'Tarjetas' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Configuración' },
  ];

  const handleClick = ({ key }) => {
    if (location.pathname !== key) {
      navigate(key);
      if (onMenuItemClick) onMenuItemClick(); // Cierra el Drawer si está en móvil
    }
  };

  // Calcula la key seleccionada correctamente
  const selectedKey = menuItems.find(item => location.pathname === item.key)
    ? location.pathname
    : `/${location.pathname.split('/')[1] || ''}`;

  // Si está en Drawer, solo renderiza el Menu sin Sider
  if (isDrawer) {
    return (
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={handleClick}
        items={menuItems}
        style={{ height: '100%', borderRight: 0 }}
      />
    );
  }

  // Desktop: Sider fijo
  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={220}
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        backgroundColor: '#001529',
      }}
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={handleClick}
        items={menuItems}
      />
    </Sider>
  );
};

export default SiderMenu;