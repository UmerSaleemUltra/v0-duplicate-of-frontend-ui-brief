import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, Search } from "lucide-react"
import Navbar from "@/components/sections/navbar"
import Footer from "@/components/sections/footer"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center mt-[200px]">
          {/* 404 Number with red theme */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800 mb-4">
              404
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-800 mx-auto rounded-full mb-8" />
          </div>

          {/* Error Message */}
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            Sorry, we couldn't find the page you're looking for. The page may have been moved or doesn't exist.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Go to Homepage
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-red-200 text-red-600 hover:bg-red-50 rounded-full px-8 bg-transparent"
            >
              <Link href="/login">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Login
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-12 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-red-100 shadow-sm">
            <div className="flex items-start gap-3 text-left">
              <Search className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Need Help?</h3>
                <p className="text-sm text-gray-600">
                  If you believe this is an error, please contact our support team at{" "}
                  <a
                    href="mailto:support@buzzfiling.com"
                    className="text-red-600 hover:text-red-700 font-medium underline"
                  >
                    support@buzzfiling.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
