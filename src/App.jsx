import { ConfigProvider, theme } from 'antd';
import { useSelector } from 'react-redux';
import AppRouter from './router';

const App = () => {
  const darkMode = useSelector((state) => state.theme.darkMode);

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: darkMode
          ? {
              colorBgBase: '#18181b',      // Fondo principal
              colorBgContainer: '#23272f', // Fondo de tarjetas/contenedores
              colorTextBase: '#f4f4f5',    // Texto principal
              colorPrimary: '#2563eb',     // Color acento (botones, links)
            }
          : {},
      }}
    >
      <AppRouter />
    </ConfigProvider>
  );
};

export default App;