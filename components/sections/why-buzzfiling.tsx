import { Zap, DollarSign, Award } from "lucide-react"
import Image from "next/image"

export default function WhyBuzzFilling() {
  return (
    <div id="about" className="w-full bg-gradient-to-r from-[#880000] to-[#ff0d13] py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Left Column */}
          <div className="md:w-1/2">
            <h2 className="text-white text-4xl md:text-5xl font-bold mb-6">Why BuzzFilling?</h2>

            <p className="text-white/90 text-lg mb-10 leading-relaxed">
              We understand how to simplify the complexity of forming your company because we've lived it ourselves.
              BuzzFilling was created from our own struggles—navigating a confusing, time-consuming setup process when
              establishing our company abroad. Since then, we've dedicated ourselves to delivering expert guidance,
              affordable solutions, and the fastest turnaround, empowering entrepreneurs like you to start your business
              journey with clarity and confidence.
            </p>

            {/* Benefits */}
            <ul className="space-y-6">
              <li className="flex items-center gap-4">
                <Award className="text-white h-6 w-6 shrink-0" />
                <span className="text-white text-lg">Proven Expertise</span>
              </li>

              <li className="flex items-center gap-4">
                <DollarSign className="text-white h-6 w-6 shrink-0" />
                <span className="text-white text-lg">Best Value</span>
              </li>

              <li className="flex items-center gap-4">
                <Zap className="text-white h-6 w-6 shrink-0" />
                <span className="text-white text-lg">Lightning Speed</span>
              </li>
            </ul>
          </div>

          {/* Right Column Image */}
          <div className="md:w-1/2 relative">
            <div className="relative z-0">
              <div className="absolute top-4 right-4 w-[92%] h-[92%] bg-white/10 backdrop-blur-sm rounded-3xl z-0"></div>

              <Image
                src="https://v0.dev/_next/image?url=https%3A%2F%2Fhebbkx1anhila5yf.public.blob.vercel-storage.com%2Fimage-QPd4PbLwdpVwGTFNIjvOXFFr6OUHEy.png&w=1920&q=75"
                alt="Person working on laptop"
                width={600}
                height={500}
                className="rounded-xl relative z-10"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
