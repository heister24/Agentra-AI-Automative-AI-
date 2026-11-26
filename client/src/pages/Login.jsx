import VectorIllustration from "@/components/VectorIllustration";
import { LoginForm } from "@/components/login-form";

const Login = () => {
  return (
    <div className="vector-bg min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 select-none bg-[#18191C] text-white selection:bg-[#FFC93C] selection:text-black">
      <div className="flex flex-col items-center w-full max-w-sm mx-auto">
        {/* Handcrafted Vector Art Header */}
        <VectorIllustration />

        {/* Login Form */}
        <LoginForm className="w-full" />
      </div>
    </div>
  );
};

export default Login;
