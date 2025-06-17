import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 flex flex-col items-center justify-between">
      {/* Header */}
      <div className="w-[90%] pt-10">
        <Header />
      </div>

      {/* Main Content */}
      <div className="flex-col flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Hello There!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-center text-wrap">
              Sign up to start your anomaly detection dashboard
            </p>
          </div>

          {/* Sign In Component Container */}
          <div className="rounded-xl shadow-2xl p-8 ">
            <SignUp
              appearance={{
                elements: {
                  formButtonPrimary:
                    "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200",
                  card: "shadow-none bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200",
                  formFieldInput:
                    "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white",
                  footerActionLink:
                    "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full py-10 ">
        <Footer />
      </div>
    </div>
  );
}
