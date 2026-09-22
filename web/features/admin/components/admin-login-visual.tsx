import Image from "next/image"

export default function AdminLoginVisual() {
  return (
    <div className="relative hidden h-full w-full flex-col justify-between overflow-hidden bg-[#EDF5F0] p-9 lg:flex lg:p-11">
      {/* Decorative Organic Curved Disc Shapes behind the building */}
      <div 
        className="pointer-events-none absolute top-[10%] right-[-40px] h-[500px] w-[500px] rounded-full bg-[#BFDDD0]/75 select-none"
        aria-hidden="true"
      />
      <div 
        className="pointer-events-none absolute -bottom-10 left-[18%] h-[440px] w-[440px] rounded-full bg-[#D4E8DD]/85 select-none"
        aria-hidden="true"
      />

      {/* Apartment Architectural Photograph with organic curved boundary & building focus */}
      <div className="pointer-events-none absolute bottom-0 right-0 h-[78%] w-[64%] select-none overflow-hidden rounded-tl-[240px] rounded-bl-[140px]">
        <Image
          src="/images/admin-apartment.jpg"
          alt="Nesteeq modern residential complex"
          fill
          priority
          sizes="580px"
          className="object-cover object-right-top"
          style={{ objectPosition: "88% top" }}
        />
      </div>

      {/* Top and Left Content */}
      <div className="relative z-10 max-w-[290px]">
        {/* Section Eyebrow with sleek rule */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6B7D75]">
            ADMIN PORTAL
          </span>
          <span className="h-[1px] w-10 bg-[#6B7D75]/40" />
        </div>

        {/* Main Headline */}
        <h1 className="mt-6 text-[38px] font-bold leading-[1.08] tracking-[-0.035em] text-[#0D1F2A] lg:text-[42px]">
          Smarter
          <br />
          Communities.
          <br />
          <span className="text-[#16704F]">Better Living.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-[14px] leading-relaxed text-[#6B7B84]">
          Efficient management for
          <br />
          a connected tomorrow.
        </p>

        {/* Feature Items with vertical accent line */}
        <div className="mt-6">
          <div className="h-8 w-[2px] rounded-full bg-[#7D9A8D]" />

          <div className="mt-4 space-y-3">
            <div>
              <h2 className="text-[13.5px] font-bold tracking-tight text-[#0D1F2A]">
                Manage
              </h2>
              <p className="text-[12px] text-[#71817B]">Properties with ease</p>
            </div>
            <div>
              <h2 className="text-[13.5px] font-bold tracking-tight text-[#0D1F2A]">
                Monitor
              </h2>
              <p className="text-[12px] text-[#71817B]">Real-time insights</p>
            </div>
            <div>
              <h2 className="text-[13.5px] font-bold tracking-tight text-[#0D1F2A]">
                Grow
              </h2>
              <p className="text-[12px] text-[#71817B]">Stronger communities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Subtle Brand Philosophy */}
      <div className="relative z-10 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5A776A]">
          A BETTER TOMORROW
        </p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#16704F]">
          STARTS WITH BETTER MANAGEMENT.
        </p>
      </div>
    </div>
  )
}
