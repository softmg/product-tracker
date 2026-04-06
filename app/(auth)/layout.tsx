import { Lightbulb } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
            <Lightbulb className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold">Product Tracker</span>
        </div>
        
        <div className="space-y-4">
          <blockquote className="text-lg font-medium leading-relaxed">
            &ldquo;Transform your product ideas into validated hypotheses. 
            Track experiments, measure outcomes, and make data-driven decisions.&rdquo;
          </blockquote>
          <p className="text-sm text-primary-foreground/70">
            Hypothesis Management System
          </p>
        </div>

        <div className="text-sm text-primary-foreground/50">
          Built for Product Teams
        </div>
      </div>

      {/* Right side - auth form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Lightbulb className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold">Product Tracker</span>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  )
}
