import { cn } from "cn";
import { GrGoogle } from "react-icons/gr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/configs/firebase";
import { useNavigate } from "react-router-dom";
import login from "@/features/login";
import { useDispatch } from "react-redux";
import { setUserData } from "@/redux/userSlice";

export function LoginForm({ className, ...props }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleGoogleLogin = async () => {
    try {
      const response = await signInWithPopup(auth, googleProvider);
      const token = response?.user?.accessToken;
      const loginResponse = await login(token);
      if (loginResponse?.success) {
        dispatch(setUserData(loginResponse.user));
        navigate("/");
      }
    } catch (error) {
      console.error("Google Login Error:", error.message);
    }
  };

  return (
    <div className={cn("flex flex-col gap-5 w-full", className)} {...props}>
      <Card className="border border-[#383A40] bg-[#2B2D31] rounded-2xl p-6 shadow-2xl">
        <CardHeader className="text-center p-0 pb-5">
          <CardTitle className="text-base font-mono font-bold text-white uppercase tracking-wider">
            Authentication
          </CardTitle>
          <CardDescription className="text-xs font-mono text-[#D9DADC] mt-1">
            Access your autonomous agent workspace
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <form onSubmit={(e) => e.preventDefault()}>
            <FieldGroup>
              <Field>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-11 bg-[#232428] hover:bg-white/[0.08] hover:backdrop-blur-md border border-[#383A40] hover:border-white/30 text-[#FFC93C] hover:text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl flex items-center justify-center gap-2.5 cursor-pointer transition-all shadow-md select-none group"
                >
                  <GrGoogle className="text-base text-[#FFC93C] group-hover:text-white group-hover:scale-105 transition-all" />
                  <span>Login with Google</span>
                </button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <FieldDescription className="px-4 text-center text-[11px] font-mono text-[#949BA4] leading-relaxed">
        By continuing, you agree to our{" "}
        <a
          href="#"
          className="underline text-[#D9DADC] hover:text-white transition-colors"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="#"
          className="underline text-[#D9DADC] hover:text-white transition-colors"
        >
          Privacy Policy
        </a>
        .
      </FieldDescription>
    </div>
  );
}
