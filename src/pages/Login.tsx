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

export default function LoginForm() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const login = useAuthStore((state) => state.login);
    const { post, error } = useApi();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const response: string | null = await post("/auth/login", {
            username,
            password,
        });
        if (!response) {
            toast.error(error);
            return;
        }
        // const payload = decodeJWT(response);
        // if (!payload || !payload.username) {
        //     toast.error("Invalid token" + response);
        //     return;
        // }
        login(response, username);
        toast.success("Logged in successfully!");
        navigate("/dashboard");
    };

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-4xl">
                <div className="flex flex-col gap-6">
                    <Card className="overflow-hidden p-0">
                        <CardContent className="grid p-0 md:grid-cols-2">
                            <form
                                className="p-6 md:p-8"
                                onSubmit={handleSubmit}>
                                <FieldGroup>
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <h1 className="text-2xl font-bold">
                                            Welcome back
                                        </h1>
                                        <p className="text-muted-foreground text-balance">
                                            Login to your Acme Inc account
                                        </p>
                                    </div>
                                    <Field>
                                        <FieldLabel htmlFor="username">
                                            Username
                                        </FieldLabel>
                                        <Input
                                            id="username"
                                            placeholder="user@123"
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
                                                className="ml-auto text-sm underline-offset-2 hover:underline">
                                                Forgot your password?
                                            </a>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field>
                                        <Button type="submit">Login</Button>
                                    </Field>
                                    <FieldDescription className="text-center">
                                        Don&apos;t have an account?{" "}
                                        <Link to="/register">Sign up</Link>
                                    </FieldDescription>
                                </FieldGroup>
                            </form>
                            <div className="bg-muted relative hidden md:block">
                                <img
                                    src="https://images.unsplash.com/photo-1620632524020-484c0dcf230a?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDE3fHx8ZW58MHx8fHx8"
                                    alt="Image"
                                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.8]"
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <FieldDescription className="px-6 text-center">
                        By clicking continue, you agree to our{" "}
                        <a href="#">Terms of Service</a> and{" "}
                        <a href="#">Privacy Policy</a>.
                    </FieldDescription>
                </div>
            </div>
        </div>
    );
}
