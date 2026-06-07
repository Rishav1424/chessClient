import { useMemo, forwardRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { cn } from "@/lib/utils";

interface GeneratedAvatarProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
    seed?: string;
}

const GeneratedAvatar = forwardRef<HTMLDivElement, GeneratedAvatarProps>(
    ({ seed = 'Alice', className, ...props }, ref) => {
        const avatar = useMemo(() => {
            const url = new URL('https://api.dicebear.com/10.x/adventurer/svg');
            url.searchParams.set('seed', seed);
            url.searchParams.set('size', '128');
            return url.href;
        }, [seed]);

        return (
            <Avatar ref={ref} className={cn("size-10 bg-accent", className)} {...props}>
                <AvatarImage src={avatar} alt={`${seed}'s avatar`} />
                <AvatarFallback>{seed.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
        );
    }
);

GeneratedAvatar.displayName = "GeneratedAvatar";

export default GeneratedAvatar;