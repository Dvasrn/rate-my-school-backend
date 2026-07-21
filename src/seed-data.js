import { hashPassword } from "./auth.js";

// Анхны туршилтын дата: сургуулиуд, демо хэрэглэгчид, үнэлгээнүүд.
// Демо хэрэглэгчид (нууц үг нь бүгд "demo1234"):
//   99112233 — Дэмо Сурагч (МУИС, ШУТИС-д бүртгэлтэй)
//   88112233 — Болд (СЭЗИС)
//   95112233 — Сараа (Шинэ Монгол)
export const seedData = () => {
  const schools = [
    { _id: "school-num", schoolName: "МУИС", location: "Бага тойруу, Сүхбаатар дүүрэг", schoolType: "University", isSchoolPrivate: false },
    { _id: "school-must", schoolName: "ШУТИС", location: "Бага тойруу, Сүхбаатар дүүрэг", schoolType: "University", isSchoolPrivate: false },
    { _id: "school-ufe", schoolName: "СЭЗИС", location: "Амарсанаагийн гудамж, Баянзүрх дүүрэг", schoolType: "University", isSchoolPrivate: true },
    { _id: "school-msue", schoolName: "МУБИС", location: "Бага тойруу, Сүхбаатар дүүрэг", schoolType: "University", isSchoolPrivate: false },
    { _id: "school-mnums", schoolName: "АШУҮИС", location: "Зониногийн гудамж, Сүхбаатар дүүрэг", schoolType: "University", isSchoolPrivate: false },
    { _id: "school-shinemongol", schoolName: "Шинэ Монгол", location: "Баянзүрх дүүрэг", schoolType: "HighSchool", isSchoolPrivate: true },
    { _id: "school-sant", schoolName: "Сант сургууль", location: "Хан-Уул дүүрэг", schoolType: "HighSchool", isSchoolPrivate: true },
    { _id: "school-1st", schoolName: "Нийслэлийн 1-р сургууль", location: "Чингэлтэй дүүрэг", schoolType: "HighSchool", isSchoolPrivate: false },
    { _id: "school-orchlon", schoolName: "Орчлон сургууль", location: "Сүхбаатар дүүрэг", schoolType: "HighSchool", isSchoolPrivate: true },
    { _id: "school-politech", schoolName: "Политехник коллеж", location: "Баянгол дүүрэг", schoolType: "Collage", isSchoolPrivate: false },
  ];

  const users = [
    {
      _id: "user-demo",
      username: "Дэмо Сурагч",
      phoneNumber: 99112233,
      password: hashPassword("demo1234"),
      birthDate: "2002-05-14",
      schools: [
        { schoolId: "school-num", graduated: false, enrolledAt: "2021-09-01", graduatedAt: "" },
        { schoolId: "school-must", graduated: true, enrolledAt: "2017-09-01", graduatedAt: "2021-06-15" },
      ],
    },
    {
      _id: "user-bold",
      username: "Болд",
      phoneNumber: 88112233,
      password: hashPassword("demo1234"),
      birthDate: "2001-11-02",
      schools: [
        { schoolId: "school-ufe", graduated: false, enrolledAt: "2022-09-01", graduatedAt: "" },
      ],
    },
    {
      _id: "user-saraa",
      username: "Сараа",
      phoneNumber: 95112233,
      password: hashPassword("demo1234"),
      birthDate: "2006-03-22",
      schools: [
        { schoolId: "school-shinemongol", graduated: false, enrolledAt: "2020-09-01", graduatedAt: "" },
      ],
    },
  ];

  const ratings = [
    {
      _id: "rating-1",
      userId: "user-demo",
      schoolId: "school-num",
      comment: "Багш нар маш сайн, номын сан нь гоё. Хоолны газар нь жаахан жижигхэн.",
      scores: { reputation: 5, food: 3, location: 5, teachers: 5, sportHall: 4, activetyOutsideOfSchool: 4 },
    },
    {
      _id: "rating-2",
      userId: "user-demo",
      schoolId: "school-must",
      comment: "Инженерийн лабораториуд нь шинэчлэгдсэн. Клуб дугуйлан олонтой.",
      scores: { reputation: 4, food: 3, location: 4, teachers: 4, sportHall: 5, activetyOutsideOfSchool: 5 },
    },
    {
      _id: "rating-3",
      userId: "user-bold",
      schoolId: "school-ufe",
      comment: "Орчин үеийн кампустай, багш нар туршлагатай.",
      scores: { reputation: 5, food: 4, location: 4, teachers: 5, sportHall: 3, activetyOutsideOfSchool: 4 },
    },
    {
      _id: "rating-4",
      userId: "user-saraa",
      schoolId: "school-shinemongol",
      comment: "Хичээлээс гадуурх үйл ажиллагаа маш олон янз.",
      scores: { reputation: 4, food: 4, location: 3, teachers: 5, sportHall: 4, activetyOutsideOfSchool: 5 },
    },
  ];

  return { users, schools, ratings };
};
