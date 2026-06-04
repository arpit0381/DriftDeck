import type { GetStaticProps } from 'next';
import dynamic from 'next/dynamic';

// Entire app loads client-side only — no SSR
const App = dynamic(() => import('../components/App'), { ssr: false });

export default function Home() {
  return <App />;
}

// Tell Next.js this is a fully static page (no server-side data needed)
export const getStaticProps: GetStaticProps = async () => {
  return { props: {} };
};
