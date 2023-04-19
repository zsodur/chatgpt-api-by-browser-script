# Chatgpt API By Browser Script

- 这个项目通过油猴脚本（Tampermonkey）在用户浏览器上运行，并将网页版的ChatGPT操作转换为一个API接口。
- 如果你有chatgpt plus账号，就可以使用gpt-4。
- 你可以使用这个API来做一些有趣的事情，比如玩[Auto-GPT](https://github.com/Significant-Gravitas/Auto-GPT)。

## 使用

### 第一步 安装和配置

1. 确保你的系统已安装了Node.js和npm。
2. 克隆此仓库并在项目目录下运行 `npm install` 安装依赖。
3. 运行 `npm run start` 以启动Node.js服务器。
4. 或者可以使用 Docker `docker-compose up` 来启动Node.js服务器

### 第二步 使用Tampermonkey

1. 安装[Tampermonkey](https://www.tampermonkey.net/)浏览器扩展。
2. 打开Tampermonkey管理面板并创建一个新的脚本。
3. 复制`tampermonkey-script.js`文件的内容到新建的脚本中并保存。

### 第三步 打开并登录ChatGPT

[https://chat.openai.com/](https://chat.openai.com/)

### 第四步 使用API

发送一个POST到API地址 http://localhost:8766/v1/chat/completions

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Who are you?"
    }
  ],
  "model": "gpt-4"
}
```
