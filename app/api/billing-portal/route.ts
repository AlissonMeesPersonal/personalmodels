import {NextResponse} from 'next/server';
import {adminClient,authClient,paymentConfig,stripeClient} from '@/lib/payment-server';
export async function POST(request:Request){
 const config=paymentConfig();if(!config)return NextResponse.json({error:'Portal de cobrança indisponível.'},{status:503});
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return NextResponse.json({error:'Entre na sua conta.'},{status:401});
 const {data:{user},error:authError}=await authClient(config).auth.getUser(token);if(authError||!user)return NextResponse.json({error:'Sessão inválida.'},{status:401});
 const {data,error}=await adminClient(config).from('personal_subscriptions').select('stripe_customer_id').eq('user_id',user.id).maybeSingle();
 if(error||!data?.stripe_customer_id)return NextResponse.json({error:'Assinatura não encontrada.'},{status:404});
 try{const portal=await stripeClient(config).billingPortal.sessions.create({customer:data.stripe_customer_id,return_url:`${config.origin}/personal`});return NextResponse.json({url:portal.url})}
 catch{return NextResponse.json({error:'Não foi possível abrir o portal de cobrança.'},{status:502})}
}
