import { Link, useLocation } from "wouter";
import { Calculator, Home, PenTool, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/?grade=4", label: "الصف الرابع", icon: Calculator },
    { href: "/?grade=5", label: "الصف الخامس", icon: BookOpen },
    { href: "/?grade=6", label: "الصف السادس", icon: PenTool },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-gradient-to-tr from-primary to-blue-400 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <span className="font-tajawal font-bold text-xl text-foreground tracking-tight group-hover:text-primary transition-colors">
            عباقرة الرياضيات
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (location === "/" && item.href === "/") && !location.includes("grade");
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
