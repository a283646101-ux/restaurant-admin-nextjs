import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function successResponse(data: any, message: string = 'Success') {
  return NextResponse.json({
    success: true,
    data,
    message,
  })
}

export function errorResponse(error: any, status: number = 500) {
  console.error('API Error:', error)

  let message = 'Internal Server Error'
  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    status = 400
    message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
  }

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  )
}
