import 'server-only';
import Stripe from 'stripe';
import {createClient} from '@supabase/supabase-js';

export function databaseConfig(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!publishable||!service)return null;
  return {url,publishable,service};
}
export function paymentConfig(){
  const database=databaseConfig();
  const stripeKey=process.env.STRIPE_SECRET_KEY;
  const appUrl=process.env.APP_URL;
  if(!database||!stripeKey||!appUrl)return null;
  const origin=new URL(appUrl).origin;
  if(process.env.NODE_ENV==='production'&&!origin.startsWith('https://'))return null;
  return {...database,stripeKey,origin};
}
export function adminClient(config:NonNullable<ReturnType<typeof databaseConfig>>){return createClient(config.url,config.service,{auth:{persistSession:false,autoRefreshToken:false}})}
export function authClient(config:NonNullable<ReturnType<typeof databaseConfig>>){return createClient(config.url,config.publishable,{auth:{persistSession:false,autoRefreshToken:false}})}
export function stripeClient(config:NonNullable<ReturnType<typeof paymentConfig>>){return new Stripe(config.stripeKey)}
