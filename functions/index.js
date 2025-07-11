const functions = require('firebase-functions');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');
const cors = require('cors');

admin.initializeApp();

const corsHandler = cors({ origin: true });
const client = new vision.ImageAnnotatorClient();

exports.analyzeReceipt = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Método no permitido');
    }

    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).send('Falta imageBase64 en el cuerpo');
    }

    try {
      const [result] = await client.textDetection({
        image: { content: imageBase64 },
      });

      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        return res.status(200).send({ transactions: [] });
      }

      const rawText = detections[0].description;

      // Parsing simple del texto extraído
      const transactions = parseReceiptText(rawText);

      return res.status(200).send({ transactions });
    } catch (error) {
      console.error('Error al analizar la imagen:', error);
      return res.status(500).send('Error al analizar la imagen');
    }
  });
});

function parseReceiptText(text) {
  const lines = text.split('\n');

  let amount = null;
  let date = null;

  const amountRegex = /(\$|\b)(\d+[.,]?\d{0,2})/;
  const dateRegex = /(\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/;

  for (const line of lines) {
    if (!amount && amountRegex.test(line)) {
      const match = line.match(amountRegex);
      amount = match ? parseFloat(match[2].replace(',', '.')) : null;
    }

    if (!date && dateRegex.test(line)) {
      const match = line.match(dateRegex);
      date = match ? match[1] : null;
    }

    if (amount && date) break;
  }

  return [
    {
      amount,
      date,
      description: 'Extraído automáticamente',
      sourceText: text,
    },
  ];
}
