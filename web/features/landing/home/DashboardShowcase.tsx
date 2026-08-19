"use client";

import Image from "next/image";
import { Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-fade";

const dashboardImages = [
  "/images/home/overview.jpeg",
  "/images/home/maintaince.jpeg",
  "/images/home/visitors.jpeg",
];

export default function DashboardShowcase() {
  return (
    <section className="bg-[#101211] px-5 py-20 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8FC8BA]">
            One workspace
          </p>

          <h2 className="mx-auto mt-3 max-w-[650px] text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Everything your community needs, in one place.
          </h2>
        </div>
        <div className="mx-auto max-w-[900px] overflow-hidden rounded-2xl bg-black shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <Swiper
            modules={[Autoplay, EffectFade]}
            effect="fade"
            fadeEffect={{
              crossFade: true,
            }}
            loop
            speed={800}
            autoplay={{
              delay: 4000,
              pauseOnMouseEnter: true,
              disableOnInteraction: false,
            }}
          >
            {dashboardImages.map((src) => (
              <SwiperSlide key={src}>
                <div className="relative aspect-video w-full">
                  <Image
                    src={src}
                    alt="Nesteeq dashboard preview"
                    fill
                    sizes="(max-width: 1024px) calc(100vw - 40px), 900px"
                    className="object-cover"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}