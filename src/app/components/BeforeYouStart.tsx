export function BeforeYouStart() {
  return (
    <section className="py-16 md:py-24 px-4">
      {/* Heading */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="font-['Inter',sans-serif] font-semibold text-[36px] md:text-[48px] text-[#09090b] leading-[1.15] tracking-[-0.05em]">
          Before You Start,
        </h2>
        <h2 className="font-['Inter',sans-serif] font-semibold text-[36px] md:text-[48px] text-[#71717A] leading-[1.15] tracking-[-0.05em]">
          Here's What Most Homeowners Ask
        </h2>
      </div>

      {/* Cards */}
      <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 px-4 md:px-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
        {/* Card 1 - Contact Details */}
        <div className="group bg-white hover:bg-[#09090b] transition-colors duration-300 rounded-2xl border border-[#e4e4e7] hover:border-[#09090b] p-7 md:p-8 flex flex-col min-w-[85vw] md:min-w-0 snap-start ml-3 md:ml-0">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-[#f4f4f5] group-hover:bg-white transition-colors duration-300 flex items-center justify-center mb-6">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" fill="#09090b"/>
            </svg>
          </div>

          <h3 className="font-['Inter',sans-serif] font-semibold text-[17px] text-[#09090b] group-hover:text-white transition-colors duration-300 mb-5 leading-snug">
            How will you use my<br />contact details?
          </h3>

          <div className="font-['Inter',sans-serif] text-[13.5px] text-[#52525b] group-hover:text-white transition-colors duration-300 leading-[1.7] space-y-4">
            <p>We use your contact details for one purpose only:</p>
            <p>To understand your renovation needs and connect you with suitable designers.</p>
            <div>
              <p className="mb-1.5">What this means in practice:</p>
              <div className="space-y-0.5">
                <div className="flex items-start gap-2">
                  <span className="text-[#eab308] mt-0.5">✓</span>
                  <span>We do not sell your details</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#eab308] mt-0.5">✓</span>
                  <span>We do not send mass marketing messages</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#eab308] mt-0.5">✓</span>
                  <span>Your details are only shared with designers you are matched with</span>
                </div>
              </div>
            </div>
            <p>If you choose not to proceed, your details are not pushed further.</p>
          </div>
        </div>

        {/* Card 2 - Contract */}
        <div className="group bg-white hover:bg-[#09090b] transition-colors duration-300 rounded-2xl border border-[#e4e4e7] hover:border-[#09090b] p-7 md:p-8 flex flex-col min-w-[85vw] md:min-w-0 snap-start">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-[#f4f4f5] group-hover:bg-white transition-colors duration-300 flex items-center justify-center mb-6">
            <svg width="20" height="22" viewBox="0 0 20 24" fill="none">
              <path d="M4 0C2.9 0 2 .9 2 2v20c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6l-6-6H4zm8 2l5 5h-5V2zM6 10h8v1.5H6V10zm0 3.5h8V15H6v-1.5zm0 3.5h5v1.5H6V17z" fill="#09090b"/>
            </svg>
          </div>

          <h3 className="font-['Inter',sans-serif] font-semibold text-[17px] text-[#09090b] group-hover:text-white transition-colors duration-300 mb-5 leading-snug">
            Is there a contract?<br />Am I bound to anything?
          </h3>

          <div className="font-['Inter',sans-serif] text-[13.5px] text-[#52525b] group-hover:text-white transition-colors duration-300 leading-[1.7] space-y-4">
            <p className="font-medium text-[#09090b] group-hover:text-white transition-colors duration-300">No.</p>
            <div>
              <p className="mb-1.5">Speaking to Network does not lock you into:</p>
              <div className="space-y-0.5">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <span>A designer</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <span>A contract</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <span>A renovation decision</span>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-1.5">You are free to:</p>
              <div className="space-y-0.5">
                <div className="flex items-start gap-2">
                  <span className="text-[#eab308] mt-0.5">✓</span>
                  <span>Speak to the designers</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#eab308] mt-0.5">✓</span>
                  <span>Compare proposals</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#eab308] mt-0.5">✓</span>
                  <span>Walk away at any point</span>
                </div>
              </div>
            </div>
            <p className="italic">You stay in control throughout.</p>
          </div>
        </div>

        {/* Card 3 - Hidden Costs */}
        <div className="group bg-white hover:bg-[#09090b] transition-colors duration-300 rounded-2xl border border-[#e4e4e7] hover:border-[#09090b] p-7 md:p-8 flex flex-col min-w-[85vw] md:min-w-0 snap-start">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-[#f4f4f5] group-hover:bg-white transition-colors duration-300 flex items-center justify-center mb-6">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" fill="#09090b"/>
              <path d="M12 7l-2 6h4l-2-6z" fill="#09090b"/>
              <circle cx="12" cy="16" r="1" fill="#09090b"/>
            </svg>
          </div>

          <h3 className="font-['Inter',sans-serif] font-semibold text-[17px] text-[#09090b] group-hover:text-white transition-colors duration-300 mb-5 leading-snug">
            Are there any hidden costs?
          </h3>

          <div className="font-['Inter',sans-serif] text-[13.5px] text-[#52525b] group-hover:text-white transition-colors duration-300 leading-[1.7] space-y-4">
            <p className="font-medium text-[#09090b] group-hover:text-white transition-colors duration-300">None.</p>
            <div>
              <p className="mb-1.5">Homeowners do not pay Network a fee for:</p>
              <div className="space-y-0.5">
                <div className="flex items-start gap-2">
                  <span className="text-[#eab308] mt-0.5">✓</span>
                  <span>Using the platform</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#eab308] mt-0.5">✓</span>
                  <span>Being matched with designers</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#eab308] mt-0.5">✓</span>
                  <span>Receiving guidance</span>
                </div>
              </div>
            </div>
            <p>If you proceed with a designer, any renovation costs are discussed directly with them, not us.</p>
          </div>
        </div>
      </div>
    </section>
  );
}