import * as dgram from "dgram";
console.log("hello world");

const originalExt = process.memoryUsage().external;
const times = 1e9;

const MAX_PACKET_SIZE = 1280;

const socket = dgram.createSocket({
  recvBufferSize: 16 * MAX_PACKET_SIZE,
  sendBufferSize: MAX_PACKET_SIZE,
  type: "udp4",
});

const b = Buffer.alloc(410, 1);

const test = async (): Promise<void> => {
  for (let i = 0; i < times; i++) {
    for (let j = 0; j < 1e3; j++) {
      socket.send(Buffer.from(b), 9000, "127.0.0.1");
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    // console.log("New memory with sleep 2", i, toMem(process.memoryUsage().external - originalExt));
  }
}

setInterval(() => console.log(toMem(process.memoryUsage().external - originalExt)), 3000);

function toMem(n: number): string {
  const bytes = Math.abs(n);
  const sign = n > 0 ? "+" : "-";
  if (bytes < 1e6) return sign + Math.floor(bytes / 10) / 100 + " KB";

  if (bytes < 1e9) return sign + Math.floor(bytes / 1e4) / 100 + " MB";

  return sign + Math.floor(bytes / 1e7) / 100 + " GB";
}

// main
test()
  .then(() => console.log("done"))
  .catch((e) => console.log("got error", e));