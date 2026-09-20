import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Personal Brasil | Encontre seu personal', description: 'Encontre profissionais de Educação Física por cidade, modalidade e atendimento.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }
