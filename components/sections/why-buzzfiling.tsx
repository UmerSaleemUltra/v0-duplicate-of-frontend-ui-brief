import { Zap, DollarSign, Award } from "lucide-react"
import Image from "next/image"

export default function WhyBuzzFilling() {
  return (
    <div id="about" className="w-full bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Left Column */}
          <div className="md:w-1/2">
            <h2 className="text-gray-900 text-3xl md:text-4xl font-semibold mb-4">Why BuzzFilling?</h2>

            <p className="text-[#504e4e] text-lg mb-10 leading-relaxed">
              We understand how to simplify the complexity of forming your company because we've lived it ourselves.
              BuzzFilling was created from our own struggles—navigating a confusing, time-consuming setup process when
              establishing our company abroad. Since then, we've dedicated ourselves to delivering expert guidance,
              affordable solutions, and the fastest turnaround, empowering entrepreneurs like you to start your business
              journey with clarity and confidence.
            </p>

            {/* Benefits */}
            <ul className="space-y-6">
              <li className="flex items-center gap-4">
                <Award className="text-[#ff0d13] h-6 w-6 shrink-0" />
                <span className="text-[#4e4747] text-lg">Proven Expertise</span>
              </li>

              <li className="flex items-center gap-4">
                <DollarSign className="text-[#ff0d13] h-6 w-6 shrink-0" />
                <span className="text-[#4e4747] text-lg">Best Value</span>
              </li>

              <li className="flex items-center gap-4">
                <Zap className="text-[#ff0d13] h-6 w-6 shrink-0" />
                <span className="text-[#4e4747] text-lg">Lightning Speed</span>
              </li>
            </ul>
          </div>

          {/* Right Column Image */}
          <div className="md:w-1/2 relative">
            <div className="relative z-0">
              <div className="absolute top-4 right-4 w-[92%] h-[92%] bg-[#8B0000] rounded-3xl z-0"></div>

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
