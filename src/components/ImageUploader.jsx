import { Upload, message, Image, Spin } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Dragger } = Upload;

const ImageUploader = ({ onParsed }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleUpload = async (options) => {
    const { file } = options;
    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result;
      setPreview(base64);
      setLoading(true);

      try {
        // ENVÍO A LA IA
        const response = await fetch('/api/parse-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        });

        const data = await response.json();
        onParsed(data); // Precarga formulario
        message.success('Datos extraídos con éxito');
      } catch (err) {
        console.error(err);
        message.error('Error al procesar la imagen');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <Dragger customRequest={handleUpload} showUploadList={false} accept="image/*">
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Arrastra o haz clic para subir un ticket</p>
      </Dragger>
      {loading && <Spin />}
      {preview && <Image src={preview} alt="Preview" style={{ marginTop: 12 }} />}
    </div>
  );
};

export default ImageUploader;
