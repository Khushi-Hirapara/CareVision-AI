import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { HomeCta } from "@/components/home/HomeCta";
import { HomeFeatures } from "@/components/home/HomeFeatures";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeTrustBar } from "@/components/home/HomeTrustBar";
import { HowItWorks } from "@/components/home/HowItWorks";
import { RecentScansSection } from "@/components/home/RecentScansSection";

export default function HomePage() {
  return (
    <div className="home-page">
      <HomeHero />
      <DashboardSection />
      <HomeTrustBar />
      <HomeFeatures />
      <HowItWorks />
      <RecentScansSection />
      <HomeCta />
    </div>
  );
}
