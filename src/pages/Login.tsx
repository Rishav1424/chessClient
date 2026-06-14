import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router";
import useApi from "../hooks/useApi";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import Logo from "@/components/Logo";

export default function LoginForm() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const login = useAuthStore((state) => state.login);
    const { post } = useApi();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        interface LoginResponse {
            token: string;
            user: {
                username: string;
            };
        }
        const response = await post<LoginResponse>("/auth/login", {
            username,
            password,
        });
        if (!response) {
            return;
        }
        login(response.token, response.user.username);
        toast.success("Logged in successfully!");
        navigate("/dashboard");
    };

    return (
        <div className="bg-muted/30 dark:bg-background/95 flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-4xl">
                <div className="flex flex-col gap-6">
                    <Card className="overflow-hidden p-0 border border-border/50 shadow-xl dark:shadow-primary/5 rounded-2xl bg-card/75 backdrop-blur-md">
                        <CardContent className="grid p-0 md:grid-cols-2">
                            <form
                                className="p-8 md:p-10 flex flex-col justify-center"
                                onSubmit={handleSubmit}>
                                <FieldGroup className="gap-5">
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <Logo className="mb-2" />
                                        <h1 className="text-2xl font-bold tracking-tight">
                                            Welcome back
                                        </h1>
                                        <p className="text-muted-foreground text-sm text-balance">
                                            Sign in to play chess with players worldwide
                                        </p>
                                    </div>
                                    <Field>
                                        <FieldLabel htmlFor="username">
                                            Username
                                        </FieldLabel>
                                        <Input
                                            id="username"
                                            placeholder="Enter your username"
                                            required
                                            value={username}
                                            onChange={(e) =>
                                                setUsername(e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field>
                                        <div className="flex items-center">
                                            <FieldLabel htmlFor="password">
                                                Password
                                            </FieldLabel>
                                            <a
                                                href="#"
                                                className="ml-auto text-xs text-primary hover:underline underline-offset-4">
                                                Forgot password?
                                            </a>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field className="mt-2">
                                        <Button type="submit" className="w-full font-bold shadow-md shadow-primary/20">Login</Button>
                                    </Field>
                                    <FieldDescription className="text-center text-xs">
                                        Don&apos;t have an account?{" "}
                                        <Link to="/register" className="text-primary hover:underline font-medium">Sign up</Link>
                                    </FieldDescription>
                                </FieldGroup>
                            </form>
                            <div className="bg-muted relative hidden md:block select-none overflow-hidden">
                                <img
                                    src="/chess_auth_bg.png"
                                    alt="Futuristic Chess Background"
                                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7] brightness-[0.9] transition-all duration-700 hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-background/45 to-transparent pointer-events-none" />
                            </div>
                        </CardContent>
                    </Card>
                    <FieldDescription className="px-6 text-center text-xs text-muted-foreground">
                        By clicking continue, you agree to our{" "}
                        <a href="#" className="hover:underline text-foreground/85">Terms of Service</a> and{" "}
                        <a href="#" className="hover:underline text-foreground/85">Privacy Policy</a>.
                    </FieldDescription>
                </div>
            </div>
        </div>
    );
}
