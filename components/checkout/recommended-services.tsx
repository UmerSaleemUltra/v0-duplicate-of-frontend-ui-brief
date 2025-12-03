"use client"

import type React from "react"
import { Sparkles, Globe, FileText, Shield, TrendingUp, Check } from "lucide-react"
import { Switch } from "@/components/ui/switch"

type Service = {
  id: string
  name: string
  description: string
  price: number
  icon: React.ReactNode
  popular?: boolean
}

const RECOMMENDED_SERVICES: Service[] = [
  {
    id: "website",
    name: "Professional Website",
    description: "Custom business website with hosting, SSL, and 5 pages",
    price: 999,
    icon: <Globe className="w-6 h-6" />,
    popular: true,
  },
  {
    id: "itin",
    name: "ITIN Application Service",
    description: "Complete ITIN application assistance for non-US residents",
    price: 299,
    icon: <FileText className="w-6 h-6" />,
  },
  {
    id: "trademark",
    name: "Trademark Registration",
    description: "Protect your brand name and logo with federal registration",
    price: 599,
    icon: <Shield className="w-6 h-6" />,
  },
  {
    id: "bookkeeping",
    name: "Bookkeeping Setup",
    description: "QuickBooks setup and 3 months of bookkeeping service",
    price: 799,
    icon: <TrendingUp className="w-6 h-6" />,
  },
]

type RecommendedServicesProps = {
  selectedServices: string[]
  onToggleService: (serviceId: string) => void
}

export function RecommendedServices({ selectedServices, onToggleService }: RecommendedServicesProps) {
  return (
    <div className="glass-surface rounded-3xl p-8 border-2 border-brand/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-brand">Recommended Services</h2>
          <p className="text-sm text-muted">Enhance your business formation with these popular add-ons</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {RECOMMENDED_SERVICES.map((service) => {
          const isSelected = selectedServices.includes(service.id)
          return (
            <div
              key={service.id}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                isSelected ? "border-brand bg-brand/5 shadow-lg" : "border-white/30 bg-white/50 hover:border-brand/30"
              }`}
            >
              {service.popular && (
                <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-brand text-white text-xs font-bold shadow-lg">
                  POPULAR
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isSelected ? "bg-brand text-white shadow-lg" : "bg-gray-100 text-muted"
                  }`}
                >
                  {service.icon}
                </div>
                <Switch checked={isSelected} onCheckedChange={() => onToggleService(service.id)} />
              </div>

              <h3 className="font-bold text-lg mb-2">{service.name}</h3>
              <p className="text-sm text-muted mb-4 leading-relaxed">{service.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-brand">${service.price}</span>
                {isSelected && (
                  <div className="flex items-center gap-2 text-brand text-sm font-medium">
                    <Check className="w-4 h-4" />
                    Added to cart
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
