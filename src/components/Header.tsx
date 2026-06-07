import Logo from "./Logo";
import ToggleTheme from "./ToggleTheme";
import GeneratedAvatar from "@/components/ui/generatedAvatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router";

const Header = () => {
    const { username, logout } = useAuthStore();
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-50 flex items-center gap-2 md:gap-4 px-4 md:px-12 py-4 w-full bg-background border-b border-border/40 shrink-0">
            <Logo />
            <div className="flex-1"></div>
            <ToggleTheme />
            <Separator orientation="vertical" />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <GeneratedAvatar
                        seed={username || "Guest"}
                        className="cursor-pointer md:mx-4"
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <Button variant="ghost" className="w-full cursor-pointer" onClick={() => {
                        logout();
                        navigate("/login");
                    }}>
                        <LogOut /> Logout
                    </Button>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
};

export default Header;
