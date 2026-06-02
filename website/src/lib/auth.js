import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET_KEY = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-123456';
const secret = new TextEncoder().encode(JWT_SECRET_KEY);

function normalizeJwtId(id) {
  if (!id || typeof id === 'string') return id;

  if (typeof id === 'object' && id.buffer && typeof id.buffer === 'object') {
    const bytes = Object.keys(id.buffer)
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => Number(id.buffer[key]));

    if (bytes.length > 0) {
      return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }
  }

  return String(id);
}

export async function signJWT(payload, duration = '24h') {
  const normalizedPayload = {
    ...payload,
    id: normalizeJwtId(payload.id),
  };

  return new SignJWT(normalizedPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(duration)
    .sign(secret);
}

export async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      ...payload,
      id: normalizeJwtId(payload.id),
    };
  } catch (error) {
    return null;
  }
}
