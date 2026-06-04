import type { AppProps } from 'next/app';
import '../styles/globals.css';

// No hooks, no providers — keep _app minimal to avoid SSR context issues
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
