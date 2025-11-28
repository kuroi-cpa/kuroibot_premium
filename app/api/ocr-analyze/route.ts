import { NextRequest, NextResponse } from 'next/server'
import type { OCRResult } from '@/types/expense'

// OCR解析APIエンドポイント
// 実際の運用ではGoogle Cloud Vision, AWS Textract, Azure Document Intelligenceなどを使用

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { file } = body

    if (!file || !file.data) {
      return NextResponse.json(
        { error: 'ファイルが必要です' },
        { status: 400 },
      )
    }

    // デモ用のOCR結果を生成
    // 実際の実装ではここでOCRサービスを呼び出す
    const result = await performOCR(file)

    return NextResponse.json(result)
  }
  catch (error) {
    console.error('OCR API error:', error)
    return NextResponse.json(
      { error: 'OCR解析に失敗しました' },
      { status: 500 },
    )
  }
}

// OCR処理（デモ実装）
async function performOCR(file: { name: string, type: string, data: string }): Promise<OCRResult> {
  // 実際の運用では以下のようなサービスを使用:
  // - Google Cloud Vision API
  // - AWS Textract
  // - Azure Document Intelligence
  // - OpenAI GPT-4 Vision

  // デモ用のランダムデータを生成
  const today = new Date()
  const randomDate = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  const dateStr = randomDate.toISOString().slice(0, 10)

  const vendors = [
    { name: 'Amazon.co.jp', category: '消耗品費' },
    { name: 'ヨドバシカメラ', category: '消耗品費' },
    { name: '東京電力エナジーパートナー', category: '水道光熱費' },
    { name: 'JR東日本', category: '旅費交通費' },
    { name: 'スターバックス コーヒー', category: '会議費' },
    { name: '丸善ジュンク堂書店', category: '新聞図書費' },
    { name: 'セブン-イレブン', category: '消耗品費' },
    { name: 'タクシー', category: '旅費交通費' },
    { name: 'NTTドコモ', category: '通信費' },
    { name: '楽天モバイル', category: '通信費' },
  ]

  const randomVendorInfo = vendors[Math.floor(Math.random() * vendors.length)]
  const randomAmount = Math.floor(Math.random() * 50000) + 500
  const taxRate = 0.1
  const taxAmount = Math.floor(randomAmount * taxRate / (1 + taxRate))

  const items = [
    {
      description: 'お買い上げ商品',
      quantity: 1,
      unitPrice: randomAmount - taxAmount,
      amount: randomAmount - taxAmount,
    },
  ]

  // ファイル名から情報を推測（実際のOCRでは不要）
  let vendor = randomVendorInfo.name
  if (file.name.toLowerCase().includes('amazon'))
    vendor = 'Amazon.co.jp'
  else if (file.name.toLowerCase().includes('taxi'))
    vendor = 'タクシー'

  return {
    vendor,
    date: dateStr,
    totalAmount: randomAmount,
    taxAmount,
    items,
    rawText: `
============================
       ${vendor}
============================
日付: ${dateStr}
-----------------------------
商品・サービス
  数量: 1  金額: ¥${(randomAmount - taxAmount).toLocaleString()}
-----------------------------
小計: ¥${(randomAmount - taxAmount).toLocaleString()}
消費税(10%): ¥${taxAmount.toLocaleString()}
-----------------------------
合計: ¥${randomAmount.toLocaleString()}
============================
    `.trim(),
    confidence: 0.85 + Math.random() * 0.1,
  }
}
