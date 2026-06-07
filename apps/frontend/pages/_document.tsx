import { Html, Head as NextHead, Main, NextScript as NextScriptOriginal } from 'next/document';

const Head = NextHead as any;
const NextScript = NextScriptOriginal as any;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06060c" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

