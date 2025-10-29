import React from "react";
import { BlurText } from "../effects/BlurText";
import FadeContent from "../effects/FadeContent";
import Image from "next/image";
import { ArrowRightIcon } from "lucide-react";
import StickerPeel from "../effects/StickerPeel";
import PixelBlast from "../effects/PixelBlast";

const Hero = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative">
      <PixelBlast
        className="absolute inset-0"
        variant="circle"
        pixelSize={6}
        color="#FFFBEC"
        enableRipples
        rippleSpeed={0.4}
        rippleThickness={0.12}
        rippleIntensityScale={1.5}
        patternScale={3}
        patternDensity={1.2}
        pixelSizeJitter={0.5}
        speed={0.6}
        edgeFade={0.25}
        transparent
      />
      {/* Main Hero Content */}
      <div className="max-w-4xl mx-auto text-center space-y-12">
        {/* Brand/Logo */}
        <FadeContent delay={100}>
          <div className="flex justify-center items-center gap-2 relative z-20">
            {/* <Image src="/logo.svg" alt="Logo" width={30} height={30} /> */}
            <StickerPeel
              imageSrc="/logo.svg"
              width={40}
              rotate={0}
              peelBackHoverPct={20}
              peelBackActivePct={40}
              shadowIntensity={0.6}
              lightingIntensity={0.1}
              initialPosition={{ x: -60, y: 0 }}
            />
            <div className="text-2xl font-bold tracking-tighter">ROSUI</div>
          </div>
        </FadeContent>

        {/* Main Headline */}
        <div className="space-y-6 relative z-20">
          <BlurText
            className="text-3xl md:text-5xl font-light text-center max-w-6xl 
        mx-auto "
            tag="h1"
            duration={2.5}
            stagger={0.06}
            ease="power2.out"
            skewAmount={0}
            blurAmount={10}
          >
            The web dashboard ROS developers actually want to use
          </BlurText>

          <BlurText
            className="text-2xl md:text-3xl font-semibold text-[#00000070]"
            duration={1.5}
            stagger={0.06}
            ease="power2.out"
            skewAmount={0}
            blurAmount={10}
            delay={1.2}
          >
            Real-time robot monitoring from your browser
          </BlurText>
          {/* CTA Section */}
          <FadeContent delay={1200} className="mt-16 relative z-20">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <div className="relative flex-1 w-full">
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 placeholder-slate-500"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
              </div>
              <button className="bg-blue-50 border border-blue-200 flex items-center gap-2 hover:bg-blue-100 text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors duration-200 whitespace-nowrap">
                <ArrowRightIcon className="w-4 h-4" />
                Get early access
              </button>
            </div>
          </FadeContent>
        </div>
      </div>

      {/* Dashboard Image */}
      <FadeContent delay={600}>
        <div className="mx-auto mt-16 max-w-7xl [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]">
          <div className="[perspective:1200px] [mask-image:linear-gradient(to_right,black_50%,transparent_100%)] -mr-16 pl-16 lg:-mr-56 lg:pl-56">
            <div className="[transform:rotateX(20deg);]">
              <div className="lg:h-[44rem] relative skew-x-[.36rad]">
                <Image
                  className="rounded-[--radius] z-[2] relative border dark:hidden"
                  src="/images/dashboard.png"
                  alt="ROSUI Dashboard"
                  width={2880}
                  height={2074}
                />
                <Image
                  className="rounded-[--radius] z-[2] relative hidden border dark:block"
                  src="/images/dashboard.png"
                  alt="ROSUI Dashboard"
                  width={2880}
                  height={2074}
                />
              </div>
            </div>
          </div>
        </div>
      </FadeContent>
    </div>
  );
};

export default Hero;
