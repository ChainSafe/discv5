/* eslint-env mocha */
import { expect } from "chai";
import { multiaddr } from "@multiformats/multiaddr";
import { createSecp256k1PeerId, createFromPrivKey } from "@libp2p/peer-id-factory";
import { unmarshalPrivateKey } from "@libp2p/crypto/keys";
import { ENR, SignableENR } from "@chainsafe/enr";
import { Discv5 } from "../../src/index.js";

let port = 9000;

describe("discv5 integration test", function () {
  this.timeout("5min");

  const RANDOM_PEER_ID = true; // Otherwise uses a fixed private key
  const bootnodesENRText = getMainnetBootnodesENRText();

  for (const bindAddrs of [
    {
      ip4: multiaddr(`/ip4/0.0.0.0/udp/${port++}`),
    },
    {
      ip6: multiaddr(`/ip6/::/udp/${port++}`),
    },
    {
      ip4: multiaddr(`/ip4/0.0.0.0/udp/${port++}`),
      ip6: multiaddr(`/ip6/::/udp/${port++}`),
    },
  ]) {
    it(`Connect to nodes from Mainnet bootnodes: ${Object.keys(bindAddrs)}`, async function () {
      // ip6 test fails in github runner
      if (process.env.CI && bindAddrs.ip6) this.skip();

      const peerId = RANDOM_PEER_ID
        ? await createSecp256k1PeerId()
        : await createFromPrivKey(
            await unmarshalPrivateKey(
              Buffer.from("080212205465237331224a07d9c7b9c458e0859f401ab49f01c971857d373a3e6f6fdf3a", "hex")
            )
          );

      const enr = SignableENR.createFromPeerId(peerId);

      const discv5 = Discv5.create({
        enr,
        peerId,
        bindAddrs,
        config: {
          lookupTimeout: 2000,
        },
      });

      await discv5.start();

      for (let i = 0; i < bootnodesENRText.length; i++) {
        const bootEnr = ENR.decodeTxt(bootnodesENRText[i]);
        discv5.addEnr(bootEnr);
        console.log("BOOTNODE", bootEnr.ip, bootEnr.udp);
      }

      const foundENRs: ENR[] = [];
      discv5.on("discovered", (enr) => {
        foundENRs.push(enr);
      });

      await discv5.findRandomNode();

      expect(foundENRs).to.have.length.greaterThan(0, "Should found some ENRs");
    });
  }
});

function getMainnetBootnodesENRText(): string[] {
  return [
    // # Teku team's bootnodes
    "enr:-KG4QOtcP9X1FbIMOe17QNMKqDxCpm14jcX5tiOE4_TyMrFqbmhPZHK_ZPG2Gxb1GE2xdtodOfx9-cgvNtxnRyHEmC0ghGV0aDKQ9aX9QgAAAAD__________4JpZIJ2NIJpcIQDE8KdiXNlY3AyNTZrMaEDhpehBDbZjM_L9ek699Y7vhUJ-eAdMyQW_Fil522Y0fODdGNwgiMog3VkcIIjKA",
    "enr:-KG4QDyytgmE4f7AnvW-ZaUOIi9i79qX4JwjRAiXBZCU65wOfBu-3Nb5I7b_Rmg3KCOcZM_C3y5pg7EBU5XGrcLTduQEhGV0aDKQ9aX9QgAAAAD__________4JpZIJ2NIJpcIQ2_DUbiXNlY3AyNTZrMaEDKnz_-ps3UUOfHWVYaskI5kWYO_vtYMGYCQRAR3gHDouDdGNwgiMog3VkcIIjKA",

    // # Prylab team's bootnodes
    "enr:-Ku4QImhMc1z8yCiNJ1TyUxdcfNucje3BGwEHzodEZUan8PherEo4sF7pPHPSIB1NNuSg5fZy7qFsjmUKs2ea1Whi0EBh2F0dG5ldHOIAAAAAAAAAACEZXRoMpD1pf1CAAAAAP__________gmlkgnY0gmlwhBLf22SJc2VjcDI1NmsxoQOVphkDqal4QzPMksc5wnpuC3gvSC8AfbFOnZY_On34wIN1ZHCCIyg",
    "enr:-Ku4QP2xDnEtUXIjzJ_DhlCRN9SN99RYQPJL92TMlSv7U5C1YnYLjwOQHgZIUXw6c-BvRg2Yc2QsZxxoS_pPRVe0yK8Bh2F0dG5ldHOIAAAAAAAAAACEZXRoMpD1pf1CAAAAAP__________gmlkgnY0gmlwhBLf22SJc2VjcDI1NmsxoQMeFF5GrS7UZpAH2Ly84aLK-TyvH-dRo0JM1i8yygH50YN1ZHCCJxA",
    "enr:-Ku4QPp9z1W4tAO8Ber_NQierYaOStqhDqQdOPY3bB3jDgkjcbk6YrEnVYIiCBbTxuar3CzS528d2iE7TdJsrL-dEKoBh2F0dG5ldHOIAAAAAAAAAACEZXRoMpD1pf1CAAAAAP__________gmlkgnY0gmlwhBLf22SJc2VjcDI1NmsxoQMw5fqqkw2hHC4F5HZZDPsNmPdB1Gi8JPQK7pRc9XHh-oN1ZHCCKvg",

    // # Lighthouse team's bootnodes
    "enr:-Le4QPUXJS2BTORXxyx2Ia-9ae4YqA_JWX3ssj4E_J-3z1A-HmFGrU8BpvpqhNabayXeOZ2Nq_sbeDgtzMJpLLnXFgAChGV0aDKQtTA_KgEAAAAAIgEAAAAAAIJpZIJ2NIJpcISsaa0Zg2lwNpAkAIkHAAAAAPA8kv_-awoTiXNlY3AyNTZrMaEDHAD2JKYevx89W0CcFJFiskdcEzkH_Wdv9iW42qLK79ODdWRwgiMohHVkcDaCI4I",
    "enr:-Le4QLHZDSvkLfqgEo8IWGG96h6mxwe_PsggC20CL3neLBjfXLGAQFOPSltZ7oP6ol54OvaNqO02Rnvb8YmDR274uq8ChGV0aDKQtTA_KgEAAAAAIgEAAAAAAIJpZIJ2NIJpcISLosQxg2lwNpAqAX4AAAAAAPA8kv_-ax65iXNlY3AyNTZrMaEDBJj7_dLFACaxBfaI8KZTh_SSJUjhyAyfshimvSqo22WDdWRwgiMohHVkcDaCI4I",
    "enr:-Le4QH6LQrusDbAHPjU_HcKOuMeXfdEB5NJyXgHWFadfHgiySqeDyusQMvfphdYWOzuSZO9Uq2AMRJR5O4ip7OvVma8BhGV0aDKQtTA_KgEAAAAAIgEAAAAAAIJpZIJ2NIJpcISLY9ncg2lwNpAkAh8AgQIBAAAAAAAAAAmXiXNlY3AyNTZrMaECDYCZTZEksF-kmgPholqgVt8IXr-8L7Nu7YrZ7HUpgxmDdWRwgiMohHVkcDaCI4I",
    "enr:-Le4QIqLuWybHNONr933Lk0dcMmAB5WgvGKRyDihy1wHDIVlNuuztX62W51voT4I8qD34GcTEOTmag1bcdZ_8aaT4NUBhGV0aDKQtTA_KgEAAAAAIgEAAAAAAIJpZIJ2NIJpcISLY04ng2lwNpAkAh8AgAIBAAAAAAAAAA-fiXNlY3AyNTZrMaEDscnRV6n1m-D9ID5UsURk0jsoKNXt1TIrj8uKOGW6iluDdWRwgiMohHVkcDaCI4I",

    // # EF bootnodes
    "enr:-Ku4QHqVeJ8PPICcWk1vSn_XcSkjOkNiTg6Fmii5j6vUQgvzMc9L1goFnLKgXqBJspJjIsB91LTOleFmyWWrFVATGngBh2F0dG5ldHOIAAAAAAAAAACEZXRoMpC1MD8qAAAAAP__________gmlkgnY0gmlwhAMRHkWJc2VjcDI1NmsxoQKLVXFOhp2uX6jeT0DvvDpPcU8FWMjQdR4wMuORMhpX24N1ZHCCIyg",
    "enr:-Ku4QG-2_Md3sZIAUebGYT6g0SMskIml77l6yR-M_JXc-UdNHCmHQeOiMLbylPejyJsdAPsTHJyjJB2sYGDLe0dn8uYBh2F0dG5ldHOIAAAAAAAAAACEZXRoMpC1MD8qAAAAAP__________gmlkgnY0gmlwhBLY-NyJc2VjcDI1NmsxoQORcM6e19T1T9gi7jxEZjk_sjVLGFscUNqAY9obgZaxbIN1ZHCCIyg",
    "enr:-Ku4QPn5eVhcoF1opaFEvg1b6JNFD2rqVkHQ8HApOKK61OIcIXD127bKWgAtbwI7pnxx6cDyk_nI88TrZKQaGMZj0q0Bh2F0dG5ldHOIAAAAAAAAAACEZXRoMpC1MD8qAAAAAP__________gmlkgnY0gmlwhDayLMaJc2VjcDI1NmsxoQK2sBOLGcUb4AwuYzFuAVCaNHA-dy24UuEKkeFNgCVCsIN1ZHCCIyg",
    "enr:-Ku4QEWzdnVtXc2Q0ZVigfCGggOVB2Vc1ZCPEc6j21NIFLODSJbvNaef1g4PxhPwl_3kax86YPheFUSLXPRs98vvYsoBh2F0dG5ldHOIAAAAAAAAAACEZXRoMpC1MD8qAAAAAP__________gmlkgnY0gmlwhDZBrP2Jc2VjcDI1NmsxoQM6jr8Rb1ktLEsVcKAPa08wCsKUmvoQ8khiOl_SLozf9IN1ZHCCIyg",

    // # Nimbus team's bootnodes
    "enr:-LK4QLU5_AeUzZEtpK8grqPo4EmX4el3ochu8vNNoXX1PrBjYfn8ksjeQ1eFtbL7ywMau9k_7BBQGmO26DHWgngkBCgBh2F0dG5ldHOI__________-EZXRoMpC1MD8qAAAAAP__________gmlkgnY0gmlwhAN7_O-Jc2VjcDI1NmsxoQKH1zg2Fge8Q6Zf-rLFbjGEtgvVbmDXqFVLxqquJcguFIN0Y3CCI4yDdWRwgiOM",
    "enr:-LK4QLjSKc09WkFZ5Pa1UF3KPkt3ieTZ6B7F6iDL_chyniP5NVDl10aGIu-pL9mbwZ47GM3RN63eGHPsw-MTLSYcz74Bh2F0dG5ldHOI__________-EZXRoMpC1MD8qAAAAAP__________gmlkgnY0gmlwhDQ7fI6Jc2VjcDI1NmsxoQJDU6zzDlUDgUqFSzoIuP9bWu097k2d7X4eHoJTGhbphoN0Y3CCI4yDdWRwgiOM",
  ];
}
