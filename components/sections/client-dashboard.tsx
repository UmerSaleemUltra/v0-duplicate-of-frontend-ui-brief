"use client"

import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Building2,
  FileText,
  Mail,
  Puzzle,
  Settings,
  CheckCircle,
  FileCheck,
  Landmark,
  Phone,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Building2, label: "Company", active: false },
  { icon: FileText, label: "Documents", active: false },
  { icon: Mail, label: "Mailroom", active: false },
  { icon: Puzzle, label: "Addons", active: false },
  { icon: Settings, label: "Settings", active: false },
]

const statusCards = [
  {
    icon: FileCheck,
    title: "Company Formation",
    status: "Complete",
    statusColor: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    icon: Landmark,
    title: "EIN Registration",
    status: "In Progress",
    statusColor: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    icon: CreditCard,
    title: "Bank Account",
    status: "Pending",
    statusColor: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Phone,
    title: "U.S. Phone Number",
    status: "Complete",
    statusColor: "text-green-600",
    bgColor: "bg-green-50",
  },
]

const ClientDashboardSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-2 bg-[#880000]/10 text-[#880000] rounded-full text-sm font-semibold mb-4">
            Client Portal
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Your Business, <span className="text-[#ff0d13]">One Dashboard</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Track your formation progress, access documents, and manage your business from our intuitive client
            dashboard.
          </p>
        </motion.div>

        {/* Dashboard Preview - Clean Browser Mockup */}
        <motion.div
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Browser Window */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Browser Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 border-b border-gray-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white rounded-md px-4 py-1 text-xs text-gray-500 border border-gray-200 flex items-center gap-2">
                  <span className="text-green-600">🔒</span>
                  dashboard.buzzfiling.com
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="flex min-h-[400px]">
              {/* Sidebar */}
              <div className="w-56 bg-gradient-to-b from-[#880000] to-[#ff0d13] p-4 hidden md:flex flex-col">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-6 px-2">
                  <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
                    <span className="text-[#880000] font-bold text-sm">B</span>
                  </div>
                  <span className="text-white font-bold">Buzz Filing</span>
                </div>

                {/* Company Selector */}
                <div className="bg-white/10 rounded-lg p-3 mb-6">
                  <p className="text-white/60 text-[10px] uppercase tracking-wide mb-0.5">Current Company</p>
                  <p className="text-white font-semibold text-sm">Acme Corp LLC</p>
                </div>

                {/* Nav Items */}
                <nav className="space-y-1 flex-1">
                  {sidebarItems.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                        item.active ? "bg-white text-[#880000] font-medium" : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </nav>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 bg-gray-50">
                {/* Welcome */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Welcome back, John! 👋</h3>
                  <p className="text-gray-500 text-sm">Here's your company formation status.</p>
                </div>

                {/* Status Cards Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {statusCards.map((card, index) => (
                    <motion.div
                      key={index}
                      className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                    >
                      <div className={`w-9 h-9 rounded-lg ${card.bgColor} flex items-center justify-center mb-2.5`}>
                        <card.icon className={`w-4 h-4 ${card.statusColor}`} />
                      </div>
                      <p className="text-gray-900 font-medium text-sm mb-0.5">{card.title}</p>
                      <p className={`text-xs font-medium ${card.statusColor}`}>{card.status}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Formation Progress</h4>
                      <p className="text-xs text-gray-500">3 of 4 steps completed</p>
                    </div>
                    <span className="text-2xl font-bold text-[#ff0d13]">75%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#880000] to-[#ff0d13] rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: "75%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
        
        </motion.div>
      </div>
    </section>
  )
}

export default ClientDashboardSection
