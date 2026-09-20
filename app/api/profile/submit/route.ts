import {NextResponse} from 'next/server';
import {adminClient,authClient,databaseConfig} from '@/lib/payment-server';
export async function POST(request:Request){
 const config=databaseConfig();
 if(!config)return NextResponse.json({error:'Cadastro ainda não configurado.'},{status:503});
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return NextResponse.json({error:'Entre na sua conta.'},{status:401});
 const {data:{user},error:authError}=await authClient(config).auth.getUser(token);
 if(authError||!user)return NextResponse.json({error:'Sessão inválida.'},{status:401});
 let documentPath:unknown;
 try{({documentPath}=await request.json())}catch{return NextResponse.json({error:'Envie o comprovante de inscrição.'},{status:400})}
 if(typeof documentPath!=='string'||!new RegExp(`^${user.id}/cref-document\\.(pdf|jpg|png)$`).test(documentPath))return NextResponse.json({error:'Arquivo de CREF inválido.'},{status:400});
 const db=adminClient(config);
 const {data:documents,error:documentError}=await db.storage.from('personal-cref-documents').list(user.id,{limit:100});
 if(documentError||!documents?.some(document=>`${user.id}/${document.name}`===documentPath))return NextResponse.json({error:'Envie o comprovante de inscrição antes de solicitar a análise.'},{status:400});
 const {data:profile,error:profileError}=await db.from('personal_professional_profiles').select('cref,cref_state').eq('user_id',user.id).maybeSingle();
 if(profileError||!profile?.cref)return NextResponse.json({error:'Salve seu perfil antes de solicitar a análise.'},{status:400});
 const {data:review,error:reviewError}=await db.from('personal_cref_reviews').select('status,cref,cref_state').eq('user_id',user.id).maybeSingle();
 if(reviewError)return NextResponse.json({error:'Não foi possível consultar seu cadastro.'},{status:503});
 if(review?.status==='approved'&&review.cref===profile.cref&&review.cref_state===profile.cref_state)return NextResponse.json({status:'approved'});
 const {error}=await db.from('personal_cref_reviews').upsert({user_id:user.id,cref:profile.cref,cref_state:profile.cref_state,document_path:documentPath,status:'pending',reviewed_at:null},{onConflict:'user_id'});
 if(error)return NextResponse.json({error:'Não foi possível enviar para análise.'},{status:503});
 return NextResponse.json({status:'pending'});
}
