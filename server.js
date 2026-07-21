import "dotenv/config";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { yoga } from "./src/yoga.js";

const port = Number(process.env.PORT ?? 4000);

// 0.0.0.0 дээр сонссоноор ижил WiFi дэх утаснаас хандах боломжтой
createServer(yoga).listen(port, "0.0.0.0", () => {
  const lanAddresses = Object.values(networkInterfaces())
    .flat()
    .filter((iface) => iface?.family === "IPv4" && !iface.internal)
    .map((iface) => iface.address);

  console.log("🚀 Rate My School API ажиллаж эхэллээ:");
  console.log(`   Локал:  http://localhost:${port}/api/graphql`);
  for (const address of lanAddresses) {
    console.log(`   Утаснаас (ижил WiFi): http://${address}:${port}/api/graphql`);
  }
});
