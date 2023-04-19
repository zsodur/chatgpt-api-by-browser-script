// ==UserScript==
// @name         ChatGPT API By Browser Script
// @namespace    http://tampermonkey.net/
// @version      1
// @match        https://chat.openai.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=openai.com
// @grant        none
// @license MIT
// ==/UserScript==

const WS_PORT = 8765;

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
    this.stop = false
  }

  async start({ text, model }) {
    this.stop = false
    const a = document.querySelector('a');
    a.click();
    await sleep(500);
    const label = document.querySelector('label.block.text-xs.text-gray-700');
    label.click();
    await sleep(500);
    if (model === 'gpt-4') {
      const gpt4 = document.querySelector('li.group.relative.flex:last-child');
      gpt4.click();
      await sleep(500);
    } else {
      const gpt3 = document.querySelector('li.group.relative.flex:first-child');
      gpt3.click();
      await sleep(500);
    }
    const textarea = document.querySelector('textarea');
    textarea.value = text;
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
    await sleep(500);
    const siblingButton = textarea.nextElementSibling;
    siblingButton.click();

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

  init() {
    window.addEventListener('load', () => {

      this.socket = new WebSocket(`ws://localhost:${WS_PORT}`);
      this.socket.onopen = () => {
        console.log('Server connected, can process requests now.');
      }
      this.socket.onclose = () => {
        console.log('The server connection has been disconnected, the request cannot be processed.');
      }
      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('params', data)
        this.start(data);
      };
    });
  }
}

(function () {
  'use strict';
  const app = new App();
  app.init();
})();
