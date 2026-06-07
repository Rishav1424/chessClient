import Header from "@/components/Header";
import { Separator } from "@/components/ui/separator";
import WatchRoom from "@/components/WatchRoom";

const Watch = () =>
(
    <div className="h-screen w-screen flex flex-col">
        <Header />
        <Separator />
        <WatchRoom />
    </div>
);

export default Watch;
