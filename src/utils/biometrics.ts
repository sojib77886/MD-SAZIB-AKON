/**
 * WebAuthn Biometric Authentication Helper
 * Allows users to register and verify biometrics (Fingerprint, Face Unlock, TouchID, Windows Hello)
 */

export async function checkBiometricsSupport(): Promise<{
  isSupported: boolean;
  isPlatformAuthenticatorAvailable: boolean;
}> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { isSupported: false, isPlatformAuthenticatorAvailable: false };
  }

  try {
    const isPlatformAuthenticatorAvailable =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return {
      isSupported: true,
      isPlatformAuthenticatorAvailable,
    };
  } catch {
    return { isSupported: true, isPlatformAuthenticatorAvailable: false };
  }
}

export async function registerBiometrics(username: string = 'hishab_user'): Promise<{
  success: boolean;
  credentialId?: string;
  error?: string;
}> {
  if (!window.PublicKeyCredential) {
    return { success: false, error: 'আপনার ব্রাউজারে বায়োমেট্রিক সাপোর্ট নেই।' };
  }

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'হিসাব-খাতা সিকিউরিটি',
          id: window.location.hostname || 'localhost',
        },
        user: {
          id: userId,
          name: username,
          displayName: 'হিসাব-খাতা অ্যাকাউন্ট',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'বায়োমেট্রিক নিবন্ধন সম্পন্ন হয়নি।' };
    }

    const rawId = credential.rawId ? btoa(String.fromCharCode(...new Uint8Array(credential.rawId))) : credential.id;

    return {
      success: true,
      credentialId: rawId,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('NotAllowedError') || message.includes('cancelled')) {
      return { success: false, error: 'বায়োমেট্রিক স্ক্যান বাতিল করা হয়েছে।' };
    }
    return { success: false, error: 'বায়োমেট্রিক সেটআপে সমস্যা হয়েছে: ' + message };
  }
}

export async function verifyBiometrics(credentialId?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!window.PublicKeyCredential) {
    return { success: false, error: 'আপনার ব্রাউজারে বায়োমেট্রিক সাপোর্ট নেই।' };
  }

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] = [];
    if (credentialId) {
      try {
        const rawBytes = Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0));
        allowCredentials.push({
          id: rawBytes,
          type: 'public-key',
          transports: ['internal'],
        });
      } catch {
        // fallback to prompt without specific id if decode fails
      }
    }

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname || 'localhost',
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: 'required',
        timeout: 60000,
      },
    })) as PublicKeyCredential;

    if (assertion) {
      return { success: true };
    }
    return { success: false, error: 'বায়োমেট্রিক যাচাই ব্যর্থ হয়েছে।' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('NotAllowedError') || message.includes('cancelled')) {
      return { success: false, error: 'বায়োমেট্রিক স্ক্যান বাতিল করা হয়েছে।' };
    }
    return { success: false, error: 'বায়োমেট্রিক যাচাইয়ে ব্যর্থ: ' + message };
  }
}
