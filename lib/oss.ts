import OSS from 'ali-oss'

if (!process.env.ALIYUN_OSS_ACCESS_KEY_ID || !process.env.ALIYUN_OSS_ACCESS_KEY_SECRET) {
  throw new Error('Missing ALIYUN_OSS_ACCESS_KEY_ID or ALIYUN_OSS_ACCESS_KEY_SECRET')
}

export const ossClient = new OSS({
  region: process.env.ALIYUN_OSS_REGION || 'oss-cn-beijing',
  accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
  bucket: process.env.ALIYUN_OSS_BUCKET || 'java-aiuni',
  secure: true,
})
