import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
});
