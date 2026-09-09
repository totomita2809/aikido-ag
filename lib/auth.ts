import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || "aikido-an-giang-secret-key-2026"
);

export interface SessionPayload {
    userId: string;
    username: string;
    name: string;
    role: "SUPER_ADMIN" | "COACH" | "STUDENT";
    studentId?: string | null;
    mustChangePassword?: boolean;
    [key: string]: unknown;
}

export async function createSession(payload: SessionPayload) {
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(SECRET_KEY);

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
    });
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
}