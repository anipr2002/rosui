import Hero from "@/components/landing/page/hero";
import Bento from "@/components/landing/page/bento";
import SmallSection from "@/components/landing/page/small-section";
import Footer from "@/components/landing/page/footer";
import Demo from "@/components/landing/page/demo";
import Pricing from "@/components/landing/page/pricing";

export default function Home() {
  return (
    <>
      <Hero />
      <SmallSection />
      <Bento />
      <Demo />
      <Pricing />
      <Footer />
    </>
  );
}
