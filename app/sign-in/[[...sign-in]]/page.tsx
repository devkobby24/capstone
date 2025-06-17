import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex flex-col items-center space-y-0 h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <Header />
      <SignIn />
      <Footer />
    </div>
  );
}
