import Header from "@/components/Header";
import { Separator } from "@/components/ui/separator";
import ReviewRoom from "@/components/ReviewRoom";

const Review = () => (
    <div className="h-screen w-screen flex flex-col">
        <Header />
        <Separator />
        <ReviewRoom />
    </div>
);

export default Review;
