import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";

const ToggleTheme = () => {
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        const saved = localStorage.getItem("theme");
        if (saved) {
            return saved === "dark";
        }
        return document.body.classList.contains("dark");
    });

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    const toggle = () => setDarkMode((prev) => !prev);

    return (
        <Button variant="ghost" onClick={toggle} size="icon-lg" aria-label="Toggle Theme">
            {darkMode ? (
                <Sun className=" text-amber-500 animate-pulse" />
            ) : (
                <Moon className=" text-slate-700 dark:text-slate-200" />
            )}
        </Button>
    );
};

export default ToggleTheme;
