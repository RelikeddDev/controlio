import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const Dashboard = () => {
  return (
    <Card>
      <Title level={2}>Dashboard</Title>
      <Paragraph>Bienvenido a tu panel de finanzas.</Paragraph>
    </Card>
  );
};

export default Dashboard;
