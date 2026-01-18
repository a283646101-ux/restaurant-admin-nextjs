import { NextRequest, NextResponse } from 'next/server'
import { ossClient } from '@/lib/oss'

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `dishes/${generateId()}-${file.name}`

    const result = await ossClient.put(filename, buffer)

    // Construct URL if not returned (ali-oss usually returns it but sometimes http instead of https)
    // We force https
    let url = result.url
    if (!url) {
        const bucket = process.env.ALIYUN_OSS_BUCKET
        const region = process.env.ALIYUN_OSS_REGION
        url = `https://${bucket}.${region}.aliyuncs.com/${filename}`
    } else {
        // Ensure HTTPS
        url = url.replace('http://', 'https://')
    }

    return NextResponse.json({ 
        success: true, 
        url: url,
        name: result.name 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
