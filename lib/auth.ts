import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

export interface JwtPayload {
  userId: string
  openid: string
}

export function verifyToken(request: NextRequest): JwtPayload | null {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export function requireAuth(request: NextRequest): JwtPayload | NextResponse {
  const user = verifyToken(request)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized, please login first' }, { status: 401 })
  }
  
  return user
}
