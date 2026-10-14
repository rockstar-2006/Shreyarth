import { NextRequest, NextResponse } from 'next/server';

const FIRESTORE_BASE_URL = 'https://firestore.googleapis.com/v1/projects';
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'placeholder-project-id';

interface FirestoreFieldValue {
  stringValue?: string;
  timestampValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  mapValue?: { fields: Record<string, FirestoreFieldValue> };
}

interface FirestoreDocument {
  fields?: Record<string, FirestoreFieldValue>;
}

function extractField(doc: FirestoreDocument, field: string): string | undefined {
  return doc.fields?.[field]?.stringValue;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { idToken: string; uid: string };
    const { idToken, uid } = body;

    if (!idToken || !uid) {
      return NextResponse.json({ error: 'Missing idToken or uid' }, { status: 400 });
    }

    // Fetch user role from Firestore REST API using the ID token as Bearer
    const firestoreUrl = `${FIRESTORE_BASE_URL}/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
    const firestoreRes = await fetch(firestoreUrl, {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    let role = 'student'; // default fallback
    if (firestoreRes.ok) {
      const doc = (await firestoreRes.json()) as FirestoreDocument;
      role = extractField(doc, 'role') ?? 'student';
    }

    // Set HttpOnly cookies
    const response = NextResponse.json({ ok: true, role });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    };

    response.cookies.set('session_uid', uid, cookieOptions);
    response.cookies.set('session_role', role, cookieOptions);

    return response;
  } catch (error) {
    console.error('Session POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('session_uid', '', { maxAge: 0, path: '/' });
  response.cookies.set('session_role', '', { maxAge: 0, path: '/' });
  return response;
}
