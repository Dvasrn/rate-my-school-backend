# Rate My School API

Rate My School аппын GraphQL backend. Дата MongoDB (Atlas) дээр Mongoose-оор хадгалагдана.

## Ажиллуулах

```bash
npm install
cp .env.example .env   # MONGODB_URI-гээ бичнэ
npm run seed            # анхны туршилтын дата (10 сургууль, 3 демо хэрэглэгч, үнэлгээнүүд)
npm start                # http://localhost:4000/api/graphql
```

Хөгжүүлэлтийн үед автоматаар дахин ачаалдаг горим: `npm run dev`

Туршилтын дата-г дахин үүсгэх (**collection-уудыг бүрэн цэвэрлээд** дахин бичнэ): `npm run seed`

## Демо хэрэглэгчид

| Утас | Нууц үг | Сургууль |
|---|---|---|
| 99112233 | demo1234 | МУИС, ШУТИС |
| 88112233 | demo1234 | СЭЗИС |
| 95112233 | demo1234 | Шинэ Монгол |

## Фронтендтэй холбогдох нь

Фронтенд (`rate-my-school-frontend`) хөгжүүлэлтийн үед Expo-гийн host IP-г ашиглан
`http://<таны-машины-IP>:4000/api/graphql` руу автоматаар холбогдоно —
утас, компьютер хоёр **ижил WiFi** дээр байхад л хангалттай. Нэмэлт тохиргоо хэрэггүй.

## Vercel-д deploy хийх бол

`api/graphql.js` бэлэн тул `vercel` коммандаар шууд deploy хийж болно. Deploy хийхийн
өмнө `MONGODB_URI`-г Vercel Project Settings > Environment Variables дээр (эсвэл
`vercel env add MONGODB_URI`) тохируулах шаардлагатай.

## Бүтэц

- `schema.graphql` — GraphQL схем (фронтендийн хүлээдэг гэрээтэй яг ижил)
- `src/resolvers.js` — бүх query/mutation-ийн логик
- `src/mongo.js` — MongoDB (Mongoose) холболт
- `src/models/` — Mongoose схемүүд (User, School, Rating)
- `src/auth.js` — нууц үгийн scrypt hash
- `src/seed-data.js` — анхны туршилтын дата
- `server.js` — локал HTTP сервер (порт 4000)
- `api/graphql.js` — Vercel serverless function
