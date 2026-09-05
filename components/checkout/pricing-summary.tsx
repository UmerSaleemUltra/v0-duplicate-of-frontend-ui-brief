import { Sparkles, ShoppingCart, Package, MapPin, Plus } from "lucide-react"
import type { CheckoutData } from "@/app/checkout/page"

type PricingSummaryProps = {
  data: CheckoutData
}

export function PricingSummary({ data }: PricingSummaryProps) {
  const packagePrice = data.packageType === "advanced" ? 499 : data.packageType === "starter" ? 299 : 0
  const stateFee = data.state ? 100 : 0
  const addonTotal = data.addons.length * 99

  const upsellTotal = data.upsells.reduce((sum, upsell) => {
    if (upsell === "website") return sum + 999
    if (upsell === "itin") return sum + 299
    if (upsell === "trademark") return sum + 599
    if (upsell === "bookkeeping") return sum + 799
    return sum
  }, 0)

  const subtotal = packagePrice + stateFee + addonTotal + upsellTotal
  const total = subtotal

  return (
    <div className="glass-surface rounded-3xl p-8 border-2 border-brand/20 sticky top-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center shadow-lg">
          <ShoppingCart className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Order Summary</h2>
      </div>

      <div className="space-y-4">
        {packagePrice > 0 && (
          <div className="space-y-3 pb-4 border-b border-glass-border">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand">
              <Package className="w-4 h-4" />
              <span>Formation Package</span>
            </div>
            <div className="flex justify-between items-center ml-6">
              <div>
                <div className="font-semibold">{data.packageType === "advanced" ? "Advanced" : "Starter"} Package</div>
                <div className="text-xs text-muted">Complete formation service</div>
              </div>
              <span className="font-bold text-lg">${packagePrice}</span>
            </div>
          </div>
        )}

        {stateFee > 0 && (
          <div className="space-y-3 pb-4 border-b border-glass-border">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand">
              <MapPin className="w-4 h-4" />
              <span>State Filing</span>
            </div>
            <div className="flex justify-between items-center ml-6">
              <div>
                <div className="font-semibold">State Filing Fee</div>
                <div className="text-xs text-muted">{data.state}</div>
              </div>
              <span className="font-bold text-lg">${stateFee}</span>
            </div>
          </div>
        )}

        {data.addons.length > 0 && (
          <div className="space-y-3 pb-4 border-b border-glass-border">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand">
              <Plus className="w-4 h-4" />
              <span>Add-ons ({data.addons.length})</span>
            </div>
            <div className="space-y-2 ml-6">
              {data.addons.map((addon, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-muted capitalize">{addon}</span>
                  <span className="font-semibold">$99</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.upsells.length > 0 && (
          <div className="space-y-3 pb-4 border-b border-glass-border">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand">
              <Sparkles className="w-4 h-4" />
              <span>Recommended Services ({data.upsells.length})</span>
            </div>
            <div className="space-y-2 ml-6">
              {data.upsells.includes("website") && (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Professional Website</div>
                    <div className="text-xs text-muted">Custom design + hosting</div>
                  </div>
                  <span className="font-semibold">$999</span>
                </div>
              )}
              {data.upsells.includes("itin") && (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">ITIN Service</div>
                    <div className="text-xs text-muted">Application assistance</div>
                  </div>
                  <span className="font-semibold">$299</span>
                </div>
              )}
              {data.upsells.includes("trademark") && (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Trademark Registration</div>
                    <div className="text-xs text-muted">Brand protection</div>
                  </div>
                  <span className="font-semibold">$599</span>
                </div>
              )}
              {data.upsells.includes("bookkeeping") && (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Bookkeeping Setup</div>
                    <div className="text-xs text-muted">QuickBooks + 3 months</div>
                  </div>
                  <span className="font-semibold">$799</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-muted">Subtotal</span>
            <span className="text-lg font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t-2 border-brand/20">
            <span className="text-2xl font-bold">Total</span>
            <span className="text-4xl font-bold text-brand">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-2xl bg-brand/5 border border-brand/20">
        <div className="flex items-center gap-2 text-brand text-sm font-medium mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Money-Back Guarantee</span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          100% satisfaction guaranteed or your money back within 30 days
        </p>
      </div>
    </div>
  )
}
