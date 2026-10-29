import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata: Metadata={title:'Ex Libris – Saját könyvtáram',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'Ex Libris',statusBarStyle:'default'},description:'Minden könyvnek története van. A személyes könyvtárad csendes, digitális otthona.'};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#315344'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="hu"><body>{children}</body></html>;}
