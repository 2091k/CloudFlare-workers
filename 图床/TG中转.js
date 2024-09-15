addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // 检查请求是否包含文件路径参数
  const filePath = url.searchParams.get('file_path')
  if (!filePath) {
    return new Response('缺少文件路径参数', { status: 400 })
  }

  const telegramBotToken = TELEGRAM_BOT_TOKEN;  // 使用环境变量
  const fileUrl = `https://api.telegram.org/file/bot${telegramBotToken}/${filePath}`

  try {
    const response = await fetch(fileUrl)
    
    if (!response.ok) {
      return new Response('无法从 Telegram 获取文件', { status: response.status })
    }

    // 获取文件的 Content-Type 和原始文件名
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('Content-Disposition') || '';

    // 提取文件名（如果 Content-Disposition 头部存在）
    const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/);
    const originalFileName = fileNameMatch ? fileNameMatch[1] : filePath.split('/').pop(); // 如果没有文件名，使用路径中的最后一部分作为文件名

    // 保留文件扩展名
    const fileExtension = originalFileName.includes('.') ? originalFileName.split('.').pop() : 'png'; // 默认扩展名为 png
    const randomFileName = generateRandomString(16) + '.' + fileExtension; // 生成16位随机文件名，并保留扩展名

    return new Response(response.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${randomFileName}"`, // 设置随机文件名
      },
    })
  } catch (err) {
    return new Response('发生错误：' + err.message, { status: 500 })
  }
}

// 生成16位随机字符串函数
function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
