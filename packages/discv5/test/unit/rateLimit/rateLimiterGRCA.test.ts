import {describe, expect, it} from "vitest";
import {RateLimiterGRCA} from "../../../src/rateLimit/rateLimiterGRCA.js";

describe("GRCA limit", () => {
  const replenishAllEvery = 2000;
  const maxTokens = 4;
  const key = 10;

  const testCases: {
    title: string;
    steps: {sec: Seconds; tokens: number; allows: boolean}[];
  }[] = [
    {
      steps: [
        {allows: true, sec: 0.0, tokens: 4},
        {allows: false, sec: 0.1, tokens: 1},
        {allows: true, sec: 0.5, tokens: 1},
        {allows: true, sec: 1.0, tokens: 1},
        {allows: false, sec: 1.4, tokens: 1},
        {allows: true, sec: 2.0, tokens: 2},
      ],
      //        x
      //  used  x
      // tokens x           x
      //        x  x  x     x
      //        +--+--+--+--+----> seconds
      //        |  |  |  |  |
      //        0     1     2
      title: "burst of tokens",
    },
    {
      steps: [
        {allows: true, sec: 0.0, tokens: 1},
        {allows: true, sec: 0.1, tokens: 1},
        {allows: true, sec: 0.2, tokens: 1},
        {allows: true, sec: 0.3, tokens: 1},
        {allows: false, sec: 0.4, tokens: 1},
      ],
      // if we limit to 4T per 2s, check that 4 requests worth 1 token can be sent before the
      // first half second, when one token will be available again. Check also that before
      // regaining a token, another request is rejected
      title: "Fill bucket with single requests",
    },
  ];

  for (const {title, steps} of testCases) {
    it(title, () => {
      const limiter = RateLimiterGRCA.fromQuota<number>({maxTokens, replenishAllEvery});
      for (const [i, {sec, tokens, allows}] of steps.entries()) {
        expect(limiter.allows(key, tokens, sec * 1000)).equals(allows, `step ${i}`);
      }
    });
  }
});

type Seconds = number;
