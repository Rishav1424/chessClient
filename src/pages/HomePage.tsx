import { useEffect } from "react";
import { useNavigate } from "react-router";
import Header from "@/components/Header";
import PlayGroup from "@/components/PlayGroup";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/useAuthStore";
// import { BackgroundBeams } from "@/components/ui/background-beams";

const HomePage = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard");
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="h-screen w-screen relative">
            <Header />
            <Separator />
            {/* <BackgroundBeams /> */}
            <div className="grid md:grid-cols-[2fr_1fr]">
                <PlayGroup />
            </div>
        </div>
    );
};;

export default HomePage;
