// ==UserScript==
// @name         ChatGPT API By Browser Script Updated
// @namespace    http://tampermonkey.net/
// @version      1
// @match        https://chat.openai.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=openai.com
// @grant        none
// @license MIT
// ==/UserScript==

const WS_URL = `ws://localhost:8765`;

function getTextFromNode(node) {
  let result = '';

  if (!node) return result;
  const childNodes = node.childNodes;

  for (let i = 0; i < childNodes.length; i++) {
    let childNode = childNodes[i];
    if (childNode.nodeType === Node.TEXT_NODE) {
      result += childNode.textContent;
    } else if (childNode.nodeType === Node.ELEMENT_NODE) {
      result += getTextFromNode(childNode);
    }
  }

  return result;
}

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Main app class
class App {
  constructor() {
    this.socket = null;
    this.observer = null;
    this.stop = false;
    this.dom = null;
  }

  async start({ text, model, newChat }) {
    this.stop = false
    if (newChat) {
      try {
        const a = document.querySelector('a');
        a.click();
        await sleep(500);
        const list = [...document.querySelectorAll('li.group.relative.flex')].map(item=> ({
          text: getTextFromNode(item),
          node: item
        }))
        if (model === 'gpt-4') {
          const find = document.querySelectorAll('.truncate.text-sm.font-medium')[1]
          if(find) {
            find.click();
            await sleep(500);
          }
        } else {
          const find = document.querySelectorAll('.truncate.text-sm.font-medium')[0]
          if(find) {
            find.click();
            await sleep(500);
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
    const textarea = document.querySelector('textarea');
    textarea.value = text;
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
    await sleep(500);
    //const siblingButton = textarea.nextElementSibling;
    //siblingButton.click();


    const sendButton = textarea.nextElementSibling.nextElementSibling; // Gets the next sibling twice to reach the Send button
    console.log(sendButton); // Check that the correct button was selected
    sendButton.click(); // Clicks the Send button



    this.observeMutations();
  }

  observeMutations() {
    this.observer = new MutationObserver(async (mutations) => {
      const list = [...document.querySelectorAll('div.relative.flex.gap-1')];
      const last = list[list.length - 1];
      if (!last) return;
      const lastText = getTextFromNode(last.querySelector('div.flex.flex-grow.flex-col.gap-3'));
      console.log('send', {
        text: lastText,
      })
      this.socket.send(
        JSON.stringify({
          type: 'answer',
          text: lastText,
        })
      );
      await sleep(1000);
      const button = document.querySelector('.btn-neutral');
      if(!button) return
      if (
        button.querySelector('div').textContent.trim() != 'Stop generating'
      ) {
        if(this.stop) return
        this.stop = true
        console.log('send', {
          type: 'stop',
        })
        this.socket.send(
          JSON.stringify({
            type: 'stop',
          })
        );
        this.observer.disconnect();
      }
    });

    const observerConfig = { childList: true, subtree: true };
    this.observer.observe(document.body, observerConfig);
  }

  sendHeartbeat() {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'heartbeat' }));
    }
  }

  connect() {
    this.socket = new WebSocket(WS_URL);
    this.socket.onopen = () => {
      console.log('Server connected, can process requests now.');
      this.dom.innerHTML = '<div style="color: green; ">API Connected !</div>';
    }
    this.socket.onclose = () => {
      console.log('The server connection has been disconnected, the request cannot be processed.');
      this.dom.innerHTML = '<div style="color: red; ">API Disconnected !</div>';

      setTimeout(() => {
        console.log('Attempting to reconnect...');
        this.connect();
      }, 2000);
    }
    this.socket.onerror = () => {
      console.log('Server connection error, please check the server.');
      this.dom.innerHTML = '<div style="color: red; ">API Error !</div>';
    }
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('params', data)
      this.start(data);
    };
  }

  init() {
    window.addEventListener('load', () => {
      this.dom = document.createElement('div');
      this.dom.style = 'position: fixed; top: 10px; right: 10px; z-index: 9999; display: flex; justify-content: center; align-items: center;';
      document.body.appendChild(this.dom);

      this.connect();

      setInterval(() => this.sendHeartbeat(), 30000);
    });
  }

}

(function () {
  'use strict';
  const app = new App();
  app.init();
})();
