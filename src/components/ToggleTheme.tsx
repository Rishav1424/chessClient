import { useState } from "react";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";

const ToggleTheme = () => {
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const toggle = () => {
        if (darkMode) {
            document.body.classList.remove("dark");
            setDarkMode(false);
        } else {
            document.body.classList.add("dark");
            setDarkMode(true);
        }
    };
    return (
        <Button variant="ghost" onClick={toggle} size="icon-sm" asChild>
            {!darkMode ? <Sun /> : <Moon />}
        </Button>
    );
};

export default ToggleTheme;
