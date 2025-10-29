import React from "react";

function SmallSection() {
  return (
    <section className="w-full min-h-screen py-12 md:py-24 px-4 bg-background flex items-center justify-center">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-snug md:leading-tight flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
          <span>One dashboard.</span>
          <span className="text-muted-foreground">Zero context switching.</span>
          <span className="text-muted-foreground">Stop juggling</span>
          <span className="inline-flex items-center gap-1.5 sm:gap-2">
            <span className="text-foreground">terminal windows</span>
            <img
              src="/images/terminal.png"
              alt="terminal"
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 inline-block"
            />
          </span>
          <span className="text-muted-foreground">,</span>
          <span className="inline-flex items-center gap-1.5 sm:gap-2">
            <span className="text-foreground">RViz</span>
            <img
              src="/images/rviz.png"
              alt="RViz"
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 inline-block"
            />
          </span>
          <span className="text-muted-foreground">,</span>
          <span className="text-muted-foreground">and</span>
          <span className="inline-flex items-center gap-1.5 sm:gap-2">
            <span className="text-foreground">rqt tools</span>
            <img
              src="/images/rqt.png"
              alt="rqt tools"
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 inline-block"
            />
          </span>
          <span className="text-muted-foreground">.</span>
          <span className="text-muted-foreground">
            Connect to rosbridge and start monitoring in under 30 seconds.
          </span>
        </h2>
      </div>
    </section>
  );
}

export default SmallSection;
