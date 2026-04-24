This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Configuração de E-mail (Resend)

Este projeto utiliza o [Resend](https://resend.com) para o envio de e-mails transacionais (boas-vindas, notificações de RH, etc).

1. Crie uma conta em [resend.com](https://resend.com).
2. Vá em **API Keys** e crie uma nova chave.
3. Adicione a chave ao seu arquivo `.env`:
   ```bash
   RESEND_API_KEY="sua_chave_aqui"
   ```
4. Os templates de e-mail estão localizados em `lib/email/templates` e utilizam o **React Email**.

## Deploy no Easypanel

Para que o sistema funcione corretamente em produção:
- Certifique-se de montar um volume em `/data` para persistência do SQLite e Uploads.
- Configure as variáveis `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` e `RESEND_API_KEY` no painel do Easypanel.
