import Logo from "./Logo";
import ToggleTheme from "./ToggleTheme";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "./ui/separator";
import StatusIndicator from "./ui/status-indicator";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router";

const Header = () => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    return (
        <header className="static top-0 left-0 flex items-center px-4 md:px-12 py-4 gap-1 md:gap-4 w-screen bg-background ">
            <Logo />
            <div className="flex-1"></div>
            <StatusIndicator state="active" label="51 Online" size="sm" />
            <div className="*:data-[slot=avatar]:ring-background -space-x-2 *:data-[slot=avatar]:ring-2 hidden md:flex">
                <Avatar>
                    <AvatarImage
                        src="https://github.com/shadcn.png"
                        alt="@shadcn"
                    />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar>
                    <AvatarImage
                        src="https://github.com/maxleiter.png"
                        alt="@maxleiter"
                    />
                    <AvatarFallback>LR</AvatarFallback>
                </Avatar>
                <Avatar>
                    <AvatarImage
                        src="https://github.com/evilrabbit.png"
                        alt="@evilrabbit"
                    />
                    <AvatarFallback>ER</AvatarFallback>
                </Avatar>
            </div>
            <Separator orientation="vertical" className="h-8!" />
            <ToggleTheme />
            <Separator orientation="vertical" className="h-8!" />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Avatar className="size-10 bg-accent md:mx-4">
                        <AvatarImage
                            src="https://img.icons8.com/office/40/person-male-skin-type-4.png"
                            alt="user avatar"
                        />
                        <AvatarFallback>User Icon</AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <Button variant="ghost" className="w-full" onClick={() => {
                        logout();
                        navigate("/login");
                    }}>
                        <LogOut/> Logout
                    </Button>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
};

export default Header;
