import Logo from "./Logo";
import ToggleTheme from "./ToggleTheme";
import GeneratedAvatar from "@/components/ui/generatedAvatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router";
import { Separator } from "@/components/ui/separator";

const Header = () => {
    const { username, logout } = useAuthStore();
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-50 w-full bg-background/85 backdrop-blur-md border-b border-border/40 shrink-0 select-none">
            <div className="mx-auto flex items-center justify-between gap-4 px-4 sm:px-8 py-3 w-full">
                <Logo />

                <div className="flex items-center gap-2">
                    <ToggleTheme />

                    <Separator orientation="vertical" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="focus:outline-hidden hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer">
                                <GeneratedAvatar
                                    seed={username || "Guest"}
                                    className="w-9 h-9 rounded-full border border-border/40 shadow-sm"
                                />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuLabel>
                                <span className="font-bold text-foreground text-sm leading-none">{username || "Guest Player"}</span>
                                <span className="text-muted-foreground font-medium text-[9px] tracking-wider uppercase flex items-center gap-1.5 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                                </span>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                                <LayoutDashboard className="w-4 h-4 text-muted-foreground" /> Dashboard
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => {
                                    logout();
                                    navigate("/login");
                                }}
                            >
                                <LogOut className="w-4 h-4" /> Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};

export default Header;
