import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { WebsiteBuilder } from "./WebsiteBuilder";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-jakarta" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500"], style: ["italic"], variable: "--font-cormorant" });

export default function WebsitePage() {
  return (
    <div className={`${sans.variable} ${serif.variable} min-h-full bg-white`}>
      <WebsiteBuilder />
    </div>
  );
}
