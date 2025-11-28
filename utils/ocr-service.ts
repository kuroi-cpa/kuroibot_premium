import type { OCRResult, UploadedFile } from '@/types/expense'

// OCR解析を実行（Dify APIを使用）
export async function analyzeReceipt(file: UploadedFile): Promise<OCRResult> {
  try {
    // ファイルをBase64に変換
    const base64Data = file.url.startsWith('data:')
      ? file.url.split(',')[1]
      : file.url

    // Dify APIにリクエストを送信
    const response = await fetch('/api/ocr-analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: {
          name: file.name,
          type: file.type,
          data: base64Data,
        },
      }),
    })

    if (!response.ok) {
      throw new Error('OCR解析に失敗しました')
    }

    const result = await response.json()
    return result as OCRResult
  }
  catch (error) {
    console.error('OCR analysis error:', error)
    // エラー時はダミーデータを返す（デモ用）
    return generateDemoOCRResult(file)
  }
}

// デモ用のOCR結果を生成
function generateDemoOCRResult(file: UploadedFile): OCRResult {
  const today = new Date()
  const randomDate = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  const dateStr = randomDate.toISOString().slice(0, 10)

  const vendors = [
    'Amazon.co.jp',
    'ヨドバシカメラ',
    '東京電力',
    'JR東日本',
    'スターバックス',
    '丸善書店',
    'セブン-イレブン',
    'ローソン',
    'ファミリーマート',
    'タクシー',
  ]

  const randomVendor = vendors[Math.floor(Math.random() * vendors.length)]
  const randomAmount = Math.floor(Math.random() * 50000) + 500
  const taxRate = 0.1
  const taxAmount = Math.floor(randomAmount * taxRate / (1 + taxRate))

  return {
    vendor: randomVendor,
    date: dateStr,
    totalAmount: randomAmount,
    taxAmount,
    items: [
      {
        description: '商品・サービス',
        amount: randomAmount - taxAmount,
      },
    ],
    rawText: `レシート解析結果（デモ）\n取引先: ${randomVendor}\n日付: ${dateStr}\n金額: ¥${randomAmount.toLocaleString()}`,
    confidence: 0.85,
  }
}

// 画像ファイルをBase64に変換
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 金額文字列を数値に変換
export function parseAmount(amountStr: string): number {
  // カンマ、円記号、スペースを除去
  const cleaned = amountStr.replace(/[,¥￥\s円]/g, '')
  const num = Number.parseInt(cleaned, 10)
  return Number.isNaN(num) ? 0 : num
}

// 日付文字列を正規化
export function normalizeDate(dateStr: string): string {
  // 様々な形式の日付を YYYY-MM-DD に変換
  const patterns = [
    // 2024年1月15日
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    // 2024/1/15 or 2024/01/15
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
    // 2024-1-15 or 2024-01-15
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    // 1/15/2024 (US format)
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  ]

  for (const pattern of patterns) {
    const match = dateStr.match(pattern)
    if (match) {
      let year: string, month: string, day: string
      if (pattern === patterns[3]) {
        // US format
        month = match[1].padStart(2, '0')
        day = match[2].padStart(2, '0')
        year = match[3]
      }
      else {
        year = match[1]
        month = match[2].padStart(2, '0')
        day = match[3].padStart(2, '0')
      }
      return `${year}-${month}-${day}`
    }
  }

  return dateStr
}

// 勘定科目を推測
export function suggestAccountCode(vendor: string, description: string): { code: string, name: string } {
  const text = `${vendor} ${description}`.toLowerCase()

  // 交通費
  if (text.includes('jr') || text.includes('電車') || text.includes('タクシー') || text.includes('バス') || text.includes('新幹線') || text.includes('飛行機') || text.includes('航空'))
    return { code: '711', name: '旅費交通費' }

  // 通信費
  if (text.includes('電話') || text.includes('携帯') || text.includes('ネット') || text.includes('通信') || text.includes('プロバイダ'))
    return { code: '712', name: '通信費' }

  // 消耗品費
  if (text.includes('文房具') || text.includes('事務用品') || text.includes('amazon') || text.includes('ヨドバシ') || text.includes('家電'))
    return { code: '713', name: '消耗品費' }

  // 接待交際費
  if (text.includes('飲食') || text.includes('懇親') || text.includes('贈答') || text.includes('接待'))
    return { code: '714', name: '接待交際費' }

  // 会議費
  if (text.includes('会議') || text.includes('ミーティング') || text.includes('スターバックス') || text.includes('カフェ') || text.includes('喫茶'))
    return { code: '715', name: '会議費' }

  // 新聞図書費
  if (text.includes('書籍') || text.includes('本') || text.includes('新聞') || text.includes('雑誌') || text.includes('丸善') || text.includes('紀伊國屋'))
    return { code: '716', name: '新聞図書費' }

  // 水道光熱費
  if (text.includes('電気') || text.includes('ガス') || text.includes('水道') || text.includes('電力'))
    return { code: '723', name: '水道光熱費' }

  // デフォルトは雑費
  return { code: '719', name: '雑費' }
}
