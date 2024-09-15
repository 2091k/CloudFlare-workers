## 创建 Telegram 机器人

1. **与 BotFather 对话**
   - 打开 Telegram 应用，搜索 `BotFather`，并开始与其对话。
   - 发送 `/start` 命令以开始使用。

2. **创建新机器人**
   - 发送 `/newbot` 命令。
   - BotFather 会要求你提供一个机器人名称和用户名。名称是显示给用户看的，而用户名是唯一的，以 `bot` 结尾。
   - 完成后，BotFather 会提供一个新的 API 令牌（Token）。这个令牌用于你在代码中与 Telegram API 进行交互。务必妥善保管这个令牌，不要公开。

## 获取群组 ID

1. **将机器人添加到群组**
   - 在 Telegram 中创建一个新群组或使用现有的群组。
   - 将你刚刚创建的机器人添加到该群组中，并赋予其适当的权限（如发送消息的权限）。

2. **获取群组 ID**
   - 发送消息到群组中（最好是让机器人发送一条消息）。
   - 使用以下 URL 访问 Telegram API 来获取更新：
     ```
     https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
     ```
   - 替换 `<YOUR_BOT_TOKEN>` 为你从 BotFather 那里获得的 Token。
   - 查找返回的 JSON 数据中包含的 `chat` 对象，它会包含 `id` 字段，这就是你的群组 ID。

#### 示例步骤：
- 打开浏览器或使用工具（如 Postman）访问上述 URL。
- 查看返回的 JSON 数据：
  ```json
  {
    "ok": true,
    "result": [
      {
        "update_id": 123456789,
        "message": {
          "message_id": 1,
          "from": {
            "id": 123456789,
            "is_bot": false,
            "first_name": "Your Name",
            "username": "your_username"
          },
          "chat": {
            "id": -1001234567890,  // 这是你的群组 ID
            "title": "Your Group Title",
            "type": "supergroup"
          },
          "date": 1623432000,
          "text": "Hello!"
        }
      }
    ]
  }
