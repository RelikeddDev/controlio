import React from 'react';
import { Layout, Typography, Switch, Space, Breadcrumb } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { setDarkMode } from '../../store/themeSlice';
import { MoonFilled, SunFilled, MenuOutlined } from '@ant-design/icons';
import { useLocation, Link } from 'react-router-dom';

const { Header } = Layout;

const HeaderBar = ({ onMenuClick, showMenuButton }) => {
  const dispatch = useDispatch();
  const darkMode = useSelector((state) => state.theme.darkMode);
  const location = useLocation();

  const toggleTheme = () => {
    dispatch(setDarkMode(!darkMode));
  };

  const segmentNames = {
    '': 'Dashboard',
    transactions: 'Transacciones',
    categories: 'Categorías',
    budgets: 'Presupuestos',
    statistics: 'Estadísticas',
    settings: 'Configuración',
    cards: 'Tarjetas',
    // Agrega más si tienes nuevas rutas
  };

  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbItems = pathSegments.map((segment, index) => {
    const url = '/' + pathSegments.slice(0, index + 1).join('/');
    const name = segmentNames[segment] || segment;
    return { url, name };
  });

  if (breadcrumbItems.length === 0) {
    breadcrumbItems.push({ url: '/', name: segmentNames[''] });
  }

  return (
    <Header
      style={{
        padding: '0 24px',
        background: 'transparent',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 64,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {showMenuButton && (
          <MenuOutlined
            onClick={onMenuClick}
            style={{
              fontSize: 24,
              marginRight: 16,
              cursor: 'pointer',
              color: darkMode ? '#fff' : '#000',
            }}
          />
        )}
        <Breadcrumb
          style={{ color: darkMode ? '#fff' : '#000', fontSize: 18 }}
          items={breadcrumbItems.map(({ url, name }) => ({
            key: url,
            title: <Link to={url} style={{ color: darkMode ? '#fff' : '#000' }}>{name}</Link>,
          }))}
        />
      </div>

      <Space>
        {darkMode ? <MoonFilled style={{ color: '#fadb14' }} /> : <SunFilled />}
        <Switch checked={darkMode} onChange={toggleTheme} />
      </Space>
    </Header>
  );
};

export default HeaderBar;