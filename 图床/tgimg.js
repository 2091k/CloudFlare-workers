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
          <link rel="stylesheet" href="https://jasu.oo.me.eu.org/https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
          <style>
            .spinner-border {
              width: 3rem;
              height: 3rem;
              border-width: 0.4em;
            }
            .spinner-container {
              display: none;
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="mt-5">文件上传成功</h1>
            <p>文件已成功上传，并已发送到 Telegram 平台。</p>
            <div id="uploadedImageContainer" class="mt-3">
              <form id="uploadForm" action="/" method="post" enctype="multipart/form-data" class="mt-5">
                <div class="form-group">
                  <label for="fileInput">选择文件：</label>
                  <input type="file" id="fileInput" name="file" class="form-control-file">
                </div>
                <button type="submit" class="btn btn-primary">上传文件</button>
              </form>
              <div class="spinner-container" id="spinner">
                <div class="spinner-border text-primary" role="status">
                  <span class="sr-only">加载中...</span>
                </div>
              </div>
              <h4>上传的图片：</h4>
              <p>图片 URL：<input type="text" id="imageUrl" class="form-control" value="${proxyUrl}" readonly></p>
              <button id="copyImageUrlBtn" class="btn btn-secondary mt-2">复制 URL</button>
              <p class="mt-3">Markdown格式：<input type="text" id="markdownUrl" class="form-control" value="![image](${proxyUrl})" readonly></p>
              <button id="copyMarkdownBtn" class="btn btn-secondary mt-2">复制 Markdown</button>
              </br>
              <img id="uploadedImage" src="${proxyUrl}" alt="Uploaded Image" class="img-fluid mt-3">
            </div>
          </div>
          <script src="https://jasu.oo.me.eu.org/https://code.jquery.com/jquery-3.5.1.min.js"></script>
          <script src="https://jasu.oo.me.eu.org/https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.bundle.min.js"></script>
          <script>
            $(document).ready(function() {
              $('#copyImageUrlBtn').click(function() {
                const imageUrl = document.getElementById('imageUrl');
                imageUrl.select();
                document.execCommand('copy');
                alert('图片 URL 已复制');
              });

              $('#copyMarkdownBtn').click(function() {
                const markdownUrl = document.getElementById('markdownUrl');
                markdownUrl.select();
                document.execCommand('copy');
                alert('Markdown 已复制');
              });

              $('#uploadForm').on('submit', function() {
                $('#spinner').show(); // 显示转圈动画
              });
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
        <title>TG图床</title>
        <link rel="stylesheet" href="https://jasu.oo.me.eu.org/https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
        <style>
          .spinner-border {
            width: 3rem;
            height: 3rem;
            border-width: 0.4em;
          }
          .spinner-container {
            display: none;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="mt-5">TG图床</h1>
          <form id="uploadForm" action="/" method="post" enctype="multipart/form-data">
            <div class="form-group">
              <label for="fileInput">选择文件：</label>
              <input type="file" id="fileInput" name="file" class="form-control-file">
            </div>
            <button type="submit" class="btn btn-primary">上传文件</button>
          </form>
          <div class="spinner-container" id="spinner">
            <div class="spinner-border text-primary" role="status">
              <span class="sr-only">加载中...</span>
            </div>
          </div>
        </div>
        <script src="https://jasu.oo.me.eu.org/https://code.jquery.com/jquery-3.5.1.min.js"></script>
        <script src="https://jasu.oo.me.eu.org/https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.bundle.min.js"></script>
        <script>
          $(document).ready(function() {
            $('#uploadForm').on('submit', function() {
              $('#spinner').show(); // 显示转圈动画
            });
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
