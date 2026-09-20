# Personal Brasil

Plataforma de busca e anúncios de personal trainers. A busca pública usa perfis fictícios de demonstração. A área do personal salva um rascunho no navegador; o cadastro em nuvem e a assinatura permanecem desativados até a configuração dos serviços.

## Desenvolvimento

```bash
npm install
npm run dev
npm run build
```

## Assinaturas

| Plano | Valor mensal |
|---|---:|
| Essencial | R$ 19,90 |
| Destaque | R$ 49,90 |
| Premium | R$ 99,90 |

O fluxo preparado é: acesso por e-mail, envio do perfil, foto e comprovante privado do CREF, análise do CREF, checkout Stripe e confirmação da assinatura por webhook. Apenas perfis com CREF aprovado podem iniciar o checkout. Os valores são definidos no servidor em `lib/plans.ts`; o navegador não determina o preço.

## Para ativar

1. Usar o projeto Supabase autorizado `efahamylmoueniflnvzl`. As tabelas `personal_*` e o bucket `personal-photos` são separados das tabelas já existentes; a autenticação continua compartilhada no projeto.
2. O esquema `database/schema.sql` foi aplicado nesse projeto; revisar as políticas RLS e configurar o URL do site e redirecionamento de autenticação para `https://personalmodels.vercel.app`.
3. Conectar a conta Stripe destinada a esta plataforma. Configurar o endpoint `https://personalmodels.vercel.app/api/stripe-webhook` para eventos `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted`.
4. Configurar as variáveis de `.env.example` na Vercel, mantendo as chaves de serviço e Stripe somente no servidor. Publicar novamente.
5. Criar a área administrativa para aprovar o CREF e revisar o fluxo completo em ambiente de testes da Stripe antes de aceitar pagamentos reais.

**Não ativar o checkout real antes da etapa 5:** a aprovação de CREF e a busca com perfis reais ainda precisam ser concluídas. O retorno da página de sucesso não é prova de pagamento; a assinatura é atualizada apenas por webhook validado.

## Conferência CREF-RS

A consulta pública oficial é https://cref-rs.implanta.net.br/servicosonline/Publico/ConsultaInscritos/. O formulário permite busca por inscrição, nome e CPF/CNPJ, mas não há integração de API oficial documentada no portal. `database/cref-document.sql` adiciona armazenamento privado para PDF/JPG/PNG; o arquivo fica acessível ao próprio usuário e ao serviço de revisão. O envio deixa o registro em análise e **não comprova automaticamente a inscrição**. A aprovação exige conferência humana enquanto não houver um serviço oficial autorizado para consulta automática. Não incluir CPF ou documentos em páginas públicas.
