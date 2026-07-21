import { GraphQLError } from "graphql";
import { connectDB } from "./mongo.js";
import { User } from "./models/User.js";
import { School } from "./models/School.js";
import { Rating } from "./models/Rating.js";
import { hashPassword, verifyPassword } from "./auth.js";

const notFound = (message) =>
  new GraphQLError(message, { extensions: { code: "NOT_FOUND" } });

// ~1.5MB тайлбарласан хэмжээ — MongoDB баримт бичгийн 16MB хязгаараас хол
// байлгаж, олон зураг нэмэгдэхэд сан хэт хүнд болохоос сэргийлнэ.
const MAX_PHOTO_BASE64_LENGTH = 2_000_000;
const MAX_PHOTOS_PER_SCHOOL = 12;

export const resolvers = {
  Query: {
    getAllRating: async () => {
      await connectDB();
      return Rating.find().lean();
    },
    getAllSchool: async () => {
      await connectDB();
      return School.find().lean();
    },
    getAllUser: async () => {
      await connectDB();
      return User.find().lean();
    },
    getOneUser: async (_parent, { id }) => {
      await connectDB();
      const user = await User.findById(id).lean();
      if (!user) throw notFound("Хэрэглэгч олдсонгүй");
      return user;
    },
    getSchoolsRating: async (_parent, { schoolId }) => {
      await connectDB();
      return Rating.find({ schoolId }).lean();
    },
    getUserRating: async (_parent, { id }) => {
      await connectDB();
      return Rating.find({ userId: id }).lean();
    },
  },

  Mutation: {
    signIn: async (_parent, { input }) => {
      await connectDB();
      const exists = await User.findOne({ phoneNumber: input.phoneNumber });
      if (exists) {
        throw new GraphQLError("Энэ утасны дугаар аль хэдийн бүртгэлтэй байна");
      }
      const user = await User.create({
        username: input.username,
        phoneNumber: input.phoneNumber,
        password: hashPassword(input.password),
        birthDate: input.birthDate ?? "",
        schools: [],
      });
      return user.toObject();
    },

    login: async (_parent, { input }) => {
      await connectDB();
      const user = await User.findOne({ phoneNumber: input.phoneNumber });
      if (!user || !verifyPassword(input.password, user.password)) {
        throw new GraphQLError("Утасны дугаар эсвэл нууц үг буруу байна");
      }
      return user.toObject();
    },

    choosingSchool: async (_parent, { input }) => {
      await connectDB();
      const user = await User.findById(input.userId);
      if (!user) throw notFound("Хэрэглэгч олдсонгүй");
      const school = await School.findById(input.schoolId).lean();
      if (!school) throw notFound("Сургууль олдсонгүй");
      user.schools = user.schools ?? [];
      const alreadyChosen = user.schools.some(
        (s) => s.schoolId === input.schoolId
      );
      if (!alreadyChosen) {
        user.schools.push({
          schoolId: input.schoolId,
          graduated: input.graduated,
          enrolledAt: input.enrolledAt,
          graduatedAt: input.graduatedAt ?? "",
        });
        await user.save();
      }
      return user.toObject();
    },

    // Нэг хэрэглэгч нэг сургуульд нэг л үнэлгээтэй — дахин илгээвэл хуучныг шинэчилнэ
    addRating: async (_parent, { input }) => {
      await connectDB();
      const existing = await Rating.findOne({
        userId: input.userId,
        schoolId: input.schoolId,
      });
      if (existing) {
        existing.comment = input.comment;
        existing.scores = { ...input.scores };
        await existing.save();
        return existing.toObject();
      }
      const rating = await Rating.create({
        userId: input.userId,
        schoolId: input.schoolId,
        comment: input.comment,
        scores: { ...input.scores },
      });
      return rating.toObject();
    },

    addSchool: async (_parent, { input }) => {
      await connectDB();
      const school = await School.create({
        schoolName: input.schoolName,
        location: input.location,
        schoolType: input.schoolType ?? "HighSchool",
        isSchoolPrivate: input.isSchoolPrivate,
      });
      return school.toObject();
    },

    deleteRating: async (_parent, { _id }) => {
      await connectDB();
      const removed = await Rating.findByIdAndDelete(_id).lean();
      if (!removed) throw notFound("Үнэлгээ олдсонгүй");
      return removed;
    },

    editRating: async (_parent, { input }) => {
      await connectDB();
      const rating = await Rating.findOne({
        userId: input.userId,
        schoolId: input.schoolId,
      });
      if (!rating) throw notFound("Үнэлгээ олдсонгүй");
      rating.comment = input.comment;
      rating.scores = { ...input.scores };
      await rating.save();
      return rating.toObject();
    },

    editUser: async (_parent, { input }) => {
      await connectDB();
      const user = await User.findById(input.userId);
      if (!user) throw notFound("Хэрэглэгч олдсонгүй");
      const phoneTaken = await User.findOne({
        _id: { $ne: input.userId },
        phoneNumber: input.phoneNumber,
      });
      if (phoneTaken) {
        throw new GraphQLError(
          "Энэ утасны дугаар өөр хэрэглэгч дээр бүртгэлтэй байна"
        );
      }
      user.username = input.username;
      user.phoneNumber = input.phoneNumber;
      await user.save();
      return user.toObject();
    },
  },

  user: {
    schools: (parent) => parent.schools ?? [],
    birthDate: (parent) => parent.birthDate ?? "",
  },
};
