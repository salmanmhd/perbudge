import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
      
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-10">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
      </div>

      <div className="z-10 w-full max-w-md flex flex-col items-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-bold text-xl">₹</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to Perbudge</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue to your dashboard</p>
        </div>

        <div className="w-full">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full shadow-none border-0 bg-transparent sm:bg-card sm:border sm:border-border/40 sm:shadow-xl rounded-2xl",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border-border/40 hover:bg-muted/50 text-foreground",
                dividerLine: "bg-border/40",
                dividerText: "text-muted-foreground",
                formFieldLabel: "text-foreground font-medium",
                formFieldInput: "bg-background border-border/40 focus:border-primary focus:ring-1 focus:ring-primary text-foreground rounded-lg",
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-lg",
                footerActionText: "text-muted-foreground",
                footerActionLink: "text-primary hover:text-primary/90 font-medium",
                identityPreviewText: "text-foreground",
                identityPreviewEditButtonIcon: "text-primary",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
