import Link from "next/link";
import { Stethoscope, LogIn, UserPlus, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="font-headline">MedAgenda</span>
        </Link>
        <nav className="hidden md:flex ml-auto items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/find-a-doctor">Find a Doctor</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/ai-assistant">AI Assistant</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">For Doctors</Link>
          </Button>
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">
                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
              </Link>
            </Button>
          </div>
        </nav>
        <Button variant="ghost" size="icon" className="md:hidden ml-auto">
            <UserPlus />
            <span className="sr-only">Menu</span>
        </Button>
      </div>
    </header>
  );
}
