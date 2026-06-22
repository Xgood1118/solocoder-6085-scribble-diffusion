import Predictions from "components/predictions";
import Head from "next/head";
import pkg from "../../package.json";
import { getRecentPredictions } from "lib/db";

export default function RecentScribbles({ predictions }) {
  return (
    <div>
      <Head>
        <meta name="description" content={pkg.appMetaDescription} />
        <meta property="og:title" content={pkg.appName} />
        <meta property="og:description" content={pkg.appMetaDescription} />
        <title>Recent Scribbles - {pkg.appName}</title>
      </Head>
      <main className="container max-w-[1024px] mx-auto p-5 ">
        <div className="container max-w-[512px] mx-auto">
          <hgroup>
            <h1 className="text-center text-5xl font-bold m-4">
              {pkg.appName}
            </h1>
            <p className="text-center text-xl opacity-60 m-4">
              {pkg.appSubtitle}
            </p>
          </hgroup>
        </div>

        <Predictions
          predictions={predictions}
          submissionCount={Object.keys(predictions).length}
        />
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  const predictionsArray = await getRecentPredictions();
  const predictions = predictionsArray.reduce((acc, p) => {
    acc[p.uuid] = p;
    return acc;
  }, {});
  return { props: { predictions } };
}
