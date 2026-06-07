import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";

const ToggleTheme = () => {
    const { setTheme, resolvedTheme } = useTheme();

    const toggle = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    return (
        <Button variant="ghost" onClick={toggle} size="icon-lg" aria-label="Toggle Theme">
            {resolvedTheme === "dark" ? (
                <Sun className=" text-amber-500 animate-pulse" />
            ) : (
                <Moon className=" text-slate-700 dark:text-slate-200" />
            )}
        </Button>
    );
};

export default ToggleTheme;
