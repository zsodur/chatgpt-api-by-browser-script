const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');

const WS_PORT = 8765;
const HTTP_PORT = 8766;

class WebSocketServer {
  constructor() {
    this.server = new WebSocket.Server({ port: WS_PORT });
    this.connectedSocket = null;
    this.initialize();
  }

  initialize() {
    this.server.on('connection', (socket) => {
      this.connectedSocket = socket;
      console.log('Browser connected, can process requests now.');

      socket.on('close', () => {
        console.log('The browser connection has been disconnected, the request cannot be processed.');
        this.connectedSocket = null;
      });
    });

    console.log('WebSocket server is running');
  }

  async sendRequest(request, callback) {
    if (!this.connectedSocket) {
      callback('');
      throw new Error('The browser connection has not been established, the request cannot be processed.');
      return;
    }

    this.connectedSocket.send(JSON.stringify(request));

    let text = ''
    const handleMessage = (message) => {
      const data = message;
      const jsonString = data.toString('utf8');
      const jsonObject = JSON.parse(jsonString);

      if (jsonObject.type === 'stop') {
        this.connectedSocket.off('message', handleMessage);
        callback(text);
      } else {
        console.log('answer:', jsonObject.text)
        text = jsonObject.text
      }
    };
    this.connectedSocket.on('message', handleMessage);
  }
}

const webSocketServer = new WebSocketServer();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.post('/v1/chat/completions', async function (req, res) {
  const { messages, model } = req.body;

  console.log('request body', req.body)

  const requestPayload = `
    Now please play the role of system and answer the user's question.

    ${JSON.stringify(messages)}

    Your answer:
  `;

  webSocketServer.sendRequest(
    {
      text: requestPayload,
      model: model,
    },
    (response) => {
      try {
        const result = { choices: [{ message: { content: response } }] }
        console.log('result', result)
        res.send(result);
      } catch (error) {}
    }
  );
});

app.listen(HTTP_PORT, function () {
  console.log(`Application example, access address is http://localhost:${HTTP_PORT}/v1/chat/completions`);
});
