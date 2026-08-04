const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Expo-гийн push үйлчилгээгээр мэдэгдэл илгээнэ.
 *
 * Мэдэгдэл явуулж чадаагүй нь үндсэн үйлдлийг (жишээ нь хариулт бичихийг)
 * унагаах ёсгүй тул алдааг залгиж, зөвхөн бүртгэнэ.
 */
export async function sendPush({ to, title, body, data }) {
  if (!to || typeof to !== "string" || !to.startsWith("ExponentPushToken")) {
    return false;
  }

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify([{ to, title, body, data, sound: "default" }]),
    });
    if (!res.ok) {
      console.error("Push илгээх амжилтгүй:", res.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Push илгээхэд алдаа:", error?.message);
    return false;
  }
}
