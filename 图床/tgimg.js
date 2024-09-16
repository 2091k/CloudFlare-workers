addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === 'POST') {
    try {
      const contentType = request.headers.get('content-type');
      if (!contentType.includes('multipart/form-data')) {
        return new Response('无效的请求', { status: 400 });
      }

      const formData = await request.formData();
      const file = formData.get('file');

      if (!file) {
        return new Response('没有上传文件', { status: 400 });
      }

      // 使用文件的原始名称，而不是随机文件名
      const originalFileName = file.name;

      const telegramBotToken = TELEGRAM_BOT_TOKEN;  // 使用环境变量
      const chatId = TELEGRAM_CHAT_ID;  // 使用环境变量
      const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendDocument`;

      let form = new FormData();
      form.append('chat_id', chatId);
      form.append('document', new File([file], originalFileName));  // 使用原始文件名上传

      const telegramResponse = await fetch(telegramApiUrl, {
        method: 'POST',
        body: form
      });

      if (!telegramResponse.ok) {
        return new Response('发送文件到 Telegram 失败', { status: 500 });
      }

      const responseBody = await telegramResponse.json();

      let fileId = null;
      if (responseBody.result.document) {
        fileId = responseBody.result.document.file_id;
      } else if (responseBody.result.video) {
        fileId = responseBody.result.video.file_id;
      } else if (responseBody.result.photo) {
        fileId = responseBody.result.photo[responseBody.result.photo.length - 1].file_id;
      }

      if (!fileId) {
        return new Response('文件上传成功，但无法获取 file_id', { status: 500 });
      }

      const fileLinkResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${fileId}`);
      const fileLinkBody = await fileLinkResponse.json();
      const filePath = fileLinkBody.result.file_path;
      const proxyUrl = `https://tg-files.oo.me.eu.org?file_path=${filePath}`;

      return new Response(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>文件上传成功</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f7f7f7;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 50px auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          h1 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #bfbfbf;
          }
          p {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
          }
          input[type="text"] {
            background-color: #f0f0f0;
            width: 97%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-bottom: 10px;
          }
          button {
            background-color: #007bff;
            color: #fff;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
          }
          button:hover {
            background-color: #0056b3;
          }
          .image-preview {
            margin-top: 20px;
            text-align: center;
          }
          .image-preview img {
            max-width: 97%;
            height: auto;
            border: 1px solid #ccc;
            padding: 10px;
            border-radius: 8px;
            background-color: #fff;
          }
          /* 夜间模式的样式 */
          body.dark-mode {
            background-color: #333;
            color: #f7f7f7;
          }
          body.dark-mode .container {
            background-color: #444;
          }
          /* 太阳/月亮按钮样式 */
          .dark-mode-toggle {
            position: fixed;
            top: 10px;
            right: 10px;
            font-size: 24px;
            cursor: pointer;
            background: none;
            border: none;
            color: #333;
            transition: color 0.3s ease;
          }
          body.dark-mode .dark-mode-toggle {
            color: #f7f7f7;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>TG图床</h1>
          <p>文件已成功上传！</p>
          <label>图片URL：</label>
          <input type="text" id="imageUrl" value="${proxyUrl}" readonly>
          <button id="copyImageUrlBtn">复制图片URL</button>
          </br>
          <label>Markdown格式：</label>
          <input type="text" id="markdownUrl" value="![image](${proxyUrl})" readonly>
          <button id="copyMarkdownBtn">复制Markdown</button>
    
          <div class="image-preview">
            <img src="${proxyUrl}" alt="Uploaded Image">
          </div>
        </div>
        <!-- 太阳/月亮切换按钮 -->
        <button id="darkModeToggle" class="dark-mode-toggle">🌙</button>
        <script>
        // 切换白天/夜间模式
        const toggleButton = document.getElementById('darkModeToggle');
        const body = document.body;
  
        // 检查 localStorage 中是否存储了用户的模式偏好
        if (localStorage.getItem('dark-mode') === 'true') {
          body.classList.add('dark-mode');
          toggleButton.textContent = '☀'; // 如果是暗夜模式，显示太阳图标
        }
  
        toggleButton.addEventListener('click', () => {
          body.classList.toggle('dark-mode');
          const isDarkMode = body.classList.contains('dark-mode');
  
          // 切换按钮图标
          toggleButton.textContent = isDarkMode ? '☀' : '🌙';
  
          // 将用户的选择存储到 localStorage 中
          localStorage.setItem('dark-mode', isDarkMode);
        });

          document.getElementById('copyImageUrlBtn').addEventListener('click', function() {
            var imageUrl = document.getElementById('imageUrl');
            imageUrl.select();
            document.execCommand('copy');
            alert('图片URL已复制');
          });
    
          document.getElementById('copyMarkdownBtn').addEventListener('click', function() {
            var markdownUrl = document.getElementById('markdownUrl');
            markdownUrl.select();
            document.execCommand('copy');
            alert('Markdown已复制');
          });
        </script>
      </body>
      </html>
    `, {
      headers: { 'content-type': 'text/html' },
    });
    

    } catch (err) {
      return new Response('发生错误：' + err.message, { status: 500 });
    }
  } else {

    return new Response(`
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文件上传</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f7f7f7;
        margin: 0;
        padding: 0;
        transition: background-color 0.3s ease, color 0.3s ease;
      }
      .container {
        max-width: 600px;
        margin: 50px auto;
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      h1 {
        font-size: 24px;
        margin-bottom: 20px;
        color: #bfbfbf;
      }
      form {
        display: flex;
        flex-direction: column;
      }
      input[type="file"] {
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        margin-bottom: 20px;
      }
      button {
        background-color: #007bff;
        color: #fff;
        padding: 10px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      button:hover {
        background-color: #0056b3;
      }
      /* 添加旋转动画的样式 */
      .spinner {
        display: none;
        width: 3rem;
        height: 3rem;
        border: 0.4em solid #ccc;
        border-top: 0.4em solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 20px auto;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      /* 夜间模式的样式 */
      body.dark-mode {
        background-color: #333;
        color: #f7f7f7;
      }
      body.dark-mode .container {
        background-color: #444;
      }
      /* 太阳/月亮按钮样式 */
      .dark-mode-toggle {
        position: fixed;
        top: 10px;
        right: 10px;
        font-size: 24px;
        cursor: pointer;
        background: none;
        border: none;
        color: #333;
        transition: color 0.3s ease;
      }
      body.dark-mode .dark-mode-toggle {
        color: #f7f7f7;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>TG图床</h1>
      <form id="uploadForm" action="/" method="post" enctype="multipart/form-data">
        <input type="file" name="file" accept="image/*">
        <button type="submit">上传</button>
      </form>
      <!-- 动画的div -->
      <div id="spinner" class="spinner"></div>
    </div>

    <!-- 太阳/月亮切换按钮 -->
    <button id="darkModeToggle" class="dark-mode-toggle">🌙</button>

    <script>
      document.getElementById('uploadForm').addEventListener('submit', function() {
        // 当表单提交时，显示加载动画
        document.getElementById('spinner').style.display = 'block';
      });

      // 切换白天/夜间模式
      const toggleButton = document.getElementById('darkModeToggle');
      const body = document.body;

      // 检查 localStorage 中是否存储了用户的模式偏好
      if (localStorage.getItem('dark-mode') === 'true') {
        body.classList.add('dark-mode');
        toggleButton.textContent = '☀'; // 如果是暗夜模式，显示太阳图标
      }

      toggleButton.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');

        // 切换按钮图标
        toggleButton.textContent = isDarkMode ? '☀' : '🌙';

        // 将用户的选择存储到 localStorage 中
        localStorage.setItem('dark-mode', isDarkMode);
      });
    </script>
  </body>
  </html>
`, {
  headers: { 'content-type': 'text/html' },
});


  
  }
}

// 生成 16 位随机字符串的函数
function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
