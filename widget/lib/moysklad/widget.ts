/**
 * Протокол виджетов МойСклад (Vendor App):
 *   1. МойСклад открывает виджет в iframe и передаёт JWT в query (?contextKey=...).
 *   2. Виджет валидирует подпись через секретный ключ вендора.
 *   3. Извлекает accountId / userId / appUid.
 *
 * Дальше для запросов в API нужен:
 *   - либо пользовательский Bearer токен из сессии,
 *   - либо обмен contextKey на токен доступа через Vendor API.
 *
 * Документация: https://dev.moysklad.ru/doc/api/vendor/1.0/
 */

import { jwtVerify, SignJWT } from 'jose';
import type { MoyskladWidgetClaims } from './types';

const enc = new TextEncoder();

/** Проверяет JWT, переданный МойСклад в виджет */
export async function verifyWidgetToken(
  token: string,
  secret: string,
): Promise<MoyskladWidgetClaims> {
  const { payload } = await jwtVerify(token, enc.encode(secret), {
    algorithms: ['HS256'],
  });
  return payload as MoyskladWidgetClaims;
}

/**
 * Подписывает JWT для обращения к Vendor API МойСклад (например, для обмена
 * contextKey на access token, или вызова API на стороне вендора).
 */
export async function signVendorJwt(params: {
  appUid: string;
  secret: string;
  audience?: string;
  expiresIn?: number; // секунды
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (params.expiresIn ?? 300);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(params.appUid)
    .setSubject(params.appUid)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(crypto.randomUUID())
    .sign(enc.encode(params.secret));
}

export type ParsedWidgetContext = {
  accountId: string;
  userId?: string;
  appUid?: string;
  raw: MoyskladWidgetClaims;
};

export function parseClaims(claims: MoyskladWidgetClaims): ParsedWidgetContext {
  return {
    accountId: claims.accountId ?? claims.iss,
    userId: claims.userId ?? claims.sub,
    appUid: claims.appUid ?? claims.aud,
    raw: claims,
  };
}
