import * as dgram from "dgram";

const MAX_PACKET_SIZE = 1280;

const socket = dgram.createSocket({
  recvBufferSize: 16 * MAX_PACKET_SIZE,
  sendBufferSize: MAX_PACKET_SIZE,
  type: "udp4",
});
console.log("created socket");
socket.bind(9000, "127.0.0.1");
console.log("listen on localhost 9000");
const originalExt = process.memoryUsage().external;
setInterval(() => console.log(toMem(process.memoryUsage().external - originalExt)), 3000);
socket.on("message", handleIncoming);

function handleIncoming(data: Buffer): void {
  // console.log("received a data size of", data.length);
}

function toMem(n: number): string {
  const bytes = Math.abs(n);
  const sign = n > 0 ? "+" : "-";
  if (bytes < 1e6) return sign + Math.floor(bytes / 10) / 100 + " KB";

  if (bytes < 1e9) return sign + Math.floor(bytes / 1e4) / 100 + " MB";

  return sign + Math.floor(bytes / 1e7) / 100 + " GB";
}
