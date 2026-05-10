import { cn } from "@/lib/utils";

const Logo = ({className} : React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("flex h-12 items-center", className)}>
        <img src="https://img.icons8.com/carbon-copy/100/40C057/chess-com.png" alt="logo" className="h-full" />
        <span className="font-bold text-lg">CHESS.com</span>
    </div>
  )
}

export default Logo