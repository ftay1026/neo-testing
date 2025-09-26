import AuthButton from "@/components/header-auth";

export function Header() {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-medium">Begin Speak!</h1>
        <p className="text-zinc-500 mt-1">Your personal growth companion</p>
      </div>
      <AuthButton />
    </header>
  )
}