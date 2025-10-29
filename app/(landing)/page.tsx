import Hero from "@/components/landing/page/hero";
import Bento from "@/components/landing/page/bento";
import SmallSection from "@/components/landing/page/small-section";
import Footer from "@/components/landing/page/footer";
import Demo from "@/components/landing/page/demo";

export default function Home() {
  return (
    <>
      <Hero />
      <SmallSection />
      <Bento />
      <Demo />
      <Footer />
    </>
  );
}
