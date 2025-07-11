// src/components/RightAlignedButton.js
import { Button } from 'antd';

const RightAlignedButton = ({ icon, children, onClick }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
    <Button type="primary" icon={icon} onClick={onClick}>
      {children}
    </Button>
  </div>
);

export default RightAlignedButton;
