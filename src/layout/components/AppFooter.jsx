// src/components/AppFooter.jsx
import React from 'react';
import { Layout, Typography } from 'antd';

const { Footer } = Layout;
const { Text } = Typography;

const AppFooter = () => {
  return (
    <Footer style={{ textAlign: 'center' }}>
      <Text type="secondary">
        Controlio ©{new Date().getFullYear()} — Finanzas personales
      </Text>
    </Footer>
  );
};

export default AppFooter;
