import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    // We throw error in prod, but return null or dummy in dev if key is missing
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY não configurada')
    }
    console.warn('AVISO: RESEND_API_KEY não configurada. E-mails não serão enviados.')
  }
  
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY || 'dummy_key')
  }
  return resendClient
}
