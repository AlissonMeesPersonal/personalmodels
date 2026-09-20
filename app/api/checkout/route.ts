import {NextResponse} from 'next/server';
import {plans,isPlanId} from '@/lib/plans';
import {adminClient,authClient,paymentConfig,stripeClient} from '@/lib/payment-server';

export async function POST(request:Request){
  const config=paymentConfig();
  if(!config)return NextResponse.json({error:'O checkout ainda não foi configurado.'},{status:503});
  const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if(!token)return NextResponse.json({error:'Entre na sua conta para assinar.'},{status:401});
  const {data:{user},error:authError}=await authClient(config).auth.getUser(token);
  if(authError||!user?.email)return NextResponse.json({error:'Sua sessão expirou. Entre novamente.'},{status:401});
  let plan:unknown;
  try{({plan}=await request.json())}catch{return NextResponse.json({error:'Pedido inválido.'},{status:400})}
  if(!isPlanId(plan))return NextResponse.json({error:'Plano inválido.'},{status:400});
  const db=adminClient(config);
  const [{data:review,error:reviewError},{data:profile,error:profileError}]=await Promise.all([db.from('personal_cref_reviews').select('status,cref,cref_state').eq('user_id',user.id).maybeSingle(),db.from('personal_professional_profiles').select('cref,cref_state').eq('user_id',user.id).maybeSingle()]);
  if(reviewError||profileError)return NextResponse.json({error:'Não foi possível verificar seu cadastro.'},{status:503});
  if(review?.status!=='approved'||review.cref!==profile?.cref||review.cref_state!==profile?.cref_state)return NextResponse.json({error:'Seu CREF precisa ser aprovado antes da assinatura.'},{status:403});
  const {data:current,error:subscriptionError}=await db.from('personal_subscriptions').select('status,stripe_customer_id').eq('user_id',user.id).maybeSingle();
  if(subscriptionError)return NextResponse.json({error:'Não foi possível consultar sua assinatura.'},{status:503});
  if(current&&['active','trialing','past_due','unpaid','incomplete'].includes(current.status))return NextResponse.json({error:'Você já tem uma assinatura. A troca de plano ficará disponível no painel.'},{status:409});
  try{
    const stripe=stripeClient(config);
    const session=await stripe.checkout.sessions.create({
      mode:'subscription',
      customer:current?.stripe_customer_id||undefined,
      customer_email:current?.stripe_customer_id?undefined:user.email,
      client_reference_id:user.id,
      line_items:[{price_data:{currency:'brl',unit_amount:plans[plan].monthlyCents,recurring:{interval:'month'},product_data:{name:`Personal Brasil — ${plans[plan].name}`}},quantity:1}],
      subscription_data:{metadata:{user_id:user.id,plan}},
      metadata:{user_id:user.id,plan},
      success_url:`${config.origin}/personal/assinatura/${plan}?resultado=sucesso`,
      cancel_url:`${config.origin}/personal/assinatura/${plan}?resultado=cancelado`,
    });
    if(!session.url)throw new Error('Checkout sem URL');
    return NextResponse.json({url:session.url});
  }catch{return NextResponse.json({error:'Não foi possível abrir o checkout. Tente novamente.'},{status:502})}
}
