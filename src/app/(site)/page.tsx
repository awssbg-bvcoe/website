import { About } from "@/components/sections/About";
import { Advisor } from "@/components/sections/Advisor";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Join } from "@/components/sections/Join";
import { Nav } from "@/components/sections/Nav";
import { Partner } from "@/components/sections/Partner";
import { Programs } from "@/components/sections/Programs";
import { Team } from "@/components/sections/Team";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Programs />
        <Team />
        <Advisor />
        <Join />
        <Partner />
      </main>
      <Footer />
    </>
  );
}
