import { http } from "@/utils/http";

type Envelope<T> = { code: number; message: string; data: T };

/** 本人自助改密入参（后端 `ChangeMyPasswordDto`）。 */
export type ChangeMyPasswordBody = {
  oldPassword: string;
  newPassword: string;
};

/**
 * 本人自助改密 `PUT /api/app/v1/me/password`（`[auth]`；需 oldPassword）。
 * 账号级自助端点——admin 个人中心改密调它（CLAUDE.md §6 / 踩坑 #6 唯一 `app/v1/*` 例外;
 * GAP-004 已澄清不造 admin 镜像）。后端撤销全部 refresh,不主动吊销当前 access token。
 */
export const changeMyPassword = (body: ChangeMyPasswordBody) =>
  http.request<Envelope<unknown>>("put", "/api/app/v1/me/password", {
    data: body
  });
