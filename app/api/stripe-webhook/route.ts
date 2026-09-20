import {NextResponse} from 'next/server';
import Stripe from 'stripe';
import {adminClient,paymentConfig,stripeClient} from '@/lib/payment-server';
import {isPlanId} from '@/lib/plans';

export async function POST(request:Request){
  const config=paymentConfig();
  const webhookSecret=process.env.STRIPE_WEBHOOK_SECRET;
  if(!config||!webhookSecret)return NextResponse.json({error:'Webhook indisponível'},{status:503});
  const signature=request.headers.get('stripe-signature');
  if(!signature)return NextResponse.json({error:'Assinatura ausente'},{status:400});
  let event:Stripe.Event;
  try{event=stripeClient(config).webhooks.constructEvent(await request.text(),signature,webhookSecret)}
  catch{return NextResponse.json({error:'Assinatura inválida'},{status:400})}
  const stripe=stripeClient(config);
  let subscriptionId:string|undefined;
  if(event.type==='checkout.session.completed'){
    const session=event.data.object as Stripe.Checkout.Session;
    if(session.mode==='subscription'&&typeof session.subscription==='string')subscriptionId=session.subscription;
  }
  if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'||event.type==='customer.subscription.created')subscriptionId=(event.data.object as Stripe.Subscription).id;
  if(subscriptionId){
    try{
      const sub=await stripe.subscriptions.retrieve(subscriptionId);
      const userId=sub.metadata.user_id,plan=sub.metadata.plan;
      if(!userId||!isPlanId(plan))return NextResponse.json({error:'Assinatura sem identificação válida'},{status:422});
      const customerId=typeof sub.customer==='string'?sub.customer:sub.customer.id;
      const {error}=await adminClient(config).from('subscriptions').upsert({user_id:userId,plan,status:sub.status,stripe_subscription_id:sub.id,stripe_customer_id:customerId,updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if(error)throw error;
    }catch{return NextResponse.json({error:'Falha ao atualizar assinatura'},{status:500})}
  }
  return NextResponse.json({received:true});
}
