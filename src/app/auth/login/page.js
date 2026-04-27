"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
export default function LoginPage() {
  const ref = useRef();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/");
    }
  };


  useEffect(() => {

    setTimeout(() => {
      setError("");
    }, 2000);


  }, [error])
  return (
    <Card className="w-[400px] mx-auto mt-10">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={ref} onSubmit={(e) => { handleSubmit(e); ref.current.reset() }} className="flex flex-col gap-4">
          <div>
            <Label>Email</Label>
            <Input type="email" name="email" placeholder="Enter you Email" required />
          </div>
          <div className="relative">
            <Label>Password</Label>
            <div className="relative">
              <Input
                placeholder="Enter you Password"
                type={showPassword ? "text" : "password"}
                required
                name="password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <Button type="submit">Login</Button>
        </form>
        <Button variant="outline" onClick={() => signIn("google")} className="mt-2 w-full">
          Sign in with Google
        </Button>
        <div className="  flex w-full justify-center items-center">
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
        <p className="mt-4 text-sm">
          Don’t have an account? <a href="/auth/register" className="underline">Register</a>
        </p>
      </CardContent>
    </Card>
  );
}
