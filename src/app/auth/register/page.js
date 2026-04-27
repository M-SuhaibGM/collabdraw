"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const ref = useRef();
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      router.push("/auth/login");
    } else {
      const data = await res.json();
      setError(data.message);
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
        <CardTitle>Register</CardTitle>
        <CardDescription>Create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={ref} onSubmit={(e) => { handleSubmit(e); ref.current.reset() }} className="flex flex-col gap-4">
          <Label>Name</Label>
          <Input onChange={(e) => setFormData({ ...formData, name: e.target.value })} name="name" placeholder='Enter your Name' />
          <Label>Email</Label>
          <Input onChange={(e) => setFormData({ ...formData, email: e.target.value })} name="email"  placeholder="Enter your Email" />

          <div className="relative">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                required
                minLength="8"
                pattern="[A-Za-z0-9]{8,}"
                placeholder="Enter password (min 8 characters)"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
          <Button type="submit">Register</Button>
          <div className="  flex w-full justify-center items-center">
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        </form>
        <p className="mt-4 text-sm">
          Already have an account? <a href="/auth/login" className="underline">Login</a>
        </p>
      </CardContent>
    </Card>
  );
}
