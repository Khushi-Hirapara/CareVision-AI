import { ConditionRoadmap } from "@/components/home/ConditionRoadmap";
import { HomeCta } from "@/components/home/HomeCta";
import { HomeFeatures } from "@/components/home/HomeFeatures";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeOverview } from "@/components/home/HomeOverview";
import { HomeTrustBar } from "@/components/home/HomeTrustBar";
import { HowItWorks } from "@/components/home/HowItWorks";

export default function HomePage() {
  return (
    <div className="home-page">
      <HomeHero />
      <HomeTrustBar />
      <HomeOverview />
      <HowItWorks />
      <ConditionRoadmap />
      <HomeFeatures />
      <HomeCta />
    </div>
  );
}
