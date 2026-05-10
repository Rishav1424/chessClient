import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useApi from "@/hooks/useApi";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";

export default function SignupForm() {
    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const {post, data, error} = useApi();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        await post("/auth/register", {
            username,
            email,
            password,
        });
    };

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
        else if(data) {
            toast.success("Account created successfully! Please log in.");
            navigate("/login");
        }
    }, [data, error, navigate]);

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-4xl">
                <div className="flex flex-col gap-6">
                    <Card className="overflow-hidden p-0">
                        <CardContent className="grid p-0 md:grid-cols-2">
                            <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                                <FieldGroup>
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <h1 className="text-2xl font-bold">
                                            Create your account
                                        </h1>
                                        <p className="text-muted-foreground text-sm text-balance">
                                            Enter your details below to create your account
                                        </p>
                                    </div>
                                    <Field>
                                        <FieldLabel htmlFor="username">
                                            Username
                                        </FieldLabel>
                                        <Input
                                            id="username"
                                            placeholder="user123"
                                            required
                                            value={username}
                                            onChange={(e) =>
                                                setUsername(e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="email">
                                            Email
                                        </FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="user@example.com"
                                            required
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="password">
                                            Password
                                        </FieldLabel>
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
                                        <FieldLabel htmlFor="confirm-password">
                                            Confirm Password
                                        </FieldLabel>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field>
                                        <Button type="submit">
                                            Create Account
                                        </Button>
                                    </Field>
                                    <FieldDescription className="text-center">
                                        Already have an account?{" "}
                                        <Link to="/login">Sign in</Link>
                                    </FieldDescription>
                                </FieldGroup>
                            </form>
                            <div className="bg-muted relative hidden md:block">
                                <img
                                    src="/placeholder.svg"
                                    alt="Image"
                                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
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
