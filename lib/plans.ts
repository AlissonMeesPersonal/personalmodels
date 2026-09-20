export const plans = {
  essencial: {name:'Essencial',monthlyCents:1990},
  destaque: {name:'Destaque',monthlyCents:4990},
  premium: {name:'Premium',monthlyCents:9990},
} as const;
export type PlanId=keyof typeof plans;
export function isPlanId(value:unknown):value is PlanId{return typeof value==='string'&&Object.hasOwn(plans,value)}
