import * as React from "react";
import { Logo } from "./Logo";
import { AuthButtons } from "./AuthButtons";

export function StartScreen() {
  return (
    <div className= "flex flex-col h-[100dvh] w-full overflow-hidden fixed inset-0">
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-screen object-cover"
        >
          <source src="/bg/start-screen-bg.webm" type="video/webm" />
        </video>
      </div>

      {/* Content */}
      <section className="relative z-10 flex max-w-[480px] w-full h-full flex-col overflow-hidden items-stretch justify-center mx-auto px-7">
        <div className="flex flex-col items-stretch opacity-0 translate-y-4 animate-content-enter">
          <Logo
            src="/logo/logo@vector.svg"
            alt="NeuralWallet Logo"
            className="transition-all duration-1000 delay-200 animate-floating"
          />

          <header className="flex w-full flex-col text-center mt-8">
            <h1 className="text-black text-2xl font-bold leading-none transition-all duration-1000 delay-300">
              Welcome to NeuralWallet
            </h1>
            <p className="text-black/80 text-sm font-normal leading-6 mt-1 transition-all duration-1000 delay-400">
              Start your decentralised finances experience!
            </p>
          </header>

          <div className="w-full text-base font-bold mt-8 transition-all duration-1000 delay-500">
            <AuthButtons />
          </div>
        </div>
      </section>
    </div>
  );
}

export default StartScreen;
