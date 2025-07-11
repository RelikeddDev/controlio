import { Card, Typography } from 'antd';
const { Title, Paragraph } = Typography;

const Home = () => (
  <Card>
    <Title level={2}>¡Bienvenido a Controlio!</Title>
    <Paragraph>
      Tu centro de control financiero y familiar. Explora las opciones del menú lateral
      para gestionar tus presupuestos, gastos, ingresos y más.
    </Paragraph>
  </Card>
);

export default Home;
