import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../components/App'), { ssr: false });

export default function Home() {
  return <App />;
}

// Using getServerSideProps instead of getStaticProps prevents Next.js
// from prerendering this page at build time (which causes dual-React issues).
// The page renders entirely on the client anyway (ssr: false).
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
