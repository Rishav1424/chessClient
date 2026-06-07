import { cn } from "@/lib/utils";

const Logo = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div
            className={cn("flex h-12 items-center gap-3 select-none cursor-pointer", className)}
            {...props}
        >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-tr from-primary to-amber-500 shadow-md shadow-primary/30">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5.5 h-5.5 text-primary-foreground drop-shadow-sm"
                >
                    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14a1 1 0 0 0 1-1v-1H4v1a1 1 0 0 0 1 1z" />
                </svg>
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-linear-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Grandmaster<span className="text-primary">.io</span>
            </span>
        </div>
    );
};

export default Logo;