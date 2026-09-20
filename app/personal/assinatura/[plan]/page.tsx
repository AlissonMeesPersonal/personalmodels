import {notFound} from 'next/navigation';
import {isPlanId} from '@/lib/plans';
import PurchaseClient from './purchase-client';
export default async function Page({params}:{params:Promise<{plan:string}>}){
 const {plan}=await params;
 if(!isPlanId(plan))notFound();
 return <PurchaseClient plan={plan}/>;
}
