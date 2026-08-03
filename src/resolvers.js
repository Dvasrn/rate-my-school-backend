import { GraphQLError } from "graphql";
import mongoose from "mongoose";
import { connectDB } from "./mongo.js";
import { User } from "./models/User.js";
import { School } from "./models/School.js";
import { Rating } from "./models/Rating.js";
import { Teacher } from "./models/Teacher.js";
import { TeacherRating } from "./models/TeacherRating.js";
import { Question } from "./models/Question.js";
import { Answer } from "./models/Answer.js";
import { Achievement } from "./models/Achievement.js";
import { Report } from "./models/Report.js";
import { hashPassword, verifyPassword } from "./auth.js";
import { idFilter } from "./ids.js";
import { createToken } from "./token.js";

const notFound = (message) =>
  new GraphQLError(message, { extensions: { code: "NOT_FOUND" } });

// Хэн үйлдэл хийж байгааг ЗӨВХӨН токеноос тодорхойлно. Өмнө нь клиентээс
// ирсэн userId-д итгэдэг байсан тул хэн ч бусдын нэрийн өмнөөс үйлдэл хийх,
// нийтэд нээлттэй жагсаалтаас олсон админы ID-гаар админ эрх авах боломжтой
// байсан.
const requireViewer = (context) => {
  const viewer = context?.viewer;
  if (!viewer) {
    throw new GraphQLError("Нэвтэрч орно уу", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return viewer;
};

const requireAdmin = (context) => {
  const viewer = requireViewer(context);
  if (!viewer.isAdmin) {
    throw new GraphQLError(
      "Зөвхөн админ эрхтэй хэрэглэгч энэ үйлдлийг хийх боломжтой",
      { extensions: { code: "FORBIDDEN" } }
    );
  }
  return viewer;
};

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
    // Утасны дугаар зэрэг хувийн мэдээлэл агуулдаг тул зөвхөн админ.
    getAllUser: async (_parent, _args, context) => {
      await connectDB();
      requireAdmin(context);
      return User.find().lean();
    },
    getOneUser: async (_parent, { id }) => {
      await connectDB();
      const user = await User.findOne(idFilter(id)).lean();
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
    getAllReports: async () => {
      await connectDB();
      return Report.find().sort({ createdAt: -1 }).lean();
    },
    getTeachersBySchool: async (_parent, { schoolId }) => {
      await connectDB();
      return Teacher.find({ schoolId }).lean();
    },
    getOneTeacher: async (_parent, { id }) => {
      await connectDB();
      const teacher = await Teacher.findOne(idFilter(id)).lean();
      if (!teacher) throw notFound("Багш олдсонгүй");
      return teacher;
    },
    getTeacherRatings: async (_parent, { teacherId }) => {
      await connectDB();
      return TeacherRating.find({ teacherId }).lean();
    },
    getQuestionsBySchool: async (_parent, { schoolId }) => {
      await connectDB();
      return Question.find({ schoolId }).sort({ createdAt: -1 }).lean();
    },
    getAnswersByQuestion: async (_parent, { questionId }) => {
      await connectDB();
      return Answer.find({ questionId }).sort({ createdAt: 1 }).lean();
    },
    getAchievementsBySchool: async (_parent, { schoolId }) => {
      await connectDB();
      return Achievement.find({ schoolId }).sort({ year: -1 }).lean();
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
      return { ...user.toObject(), token: createToken(user._id) };
    },

    login: async (_parent, { input }) => {
      await connectDB();
      const user = await User.findOne({ phoneNumber: input.phoneNumber });
      if (!user || !verifyPassword(input.password, user.password)) {
        throw new GraphQLError("Утасны дугаар эсвэл нууц үг буруу байна");
      }
      return { ...user.toObject(), token: createToken(user._id) };
    },

    choosingSchool: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const user = await User.findOne(idFilter(viewer._id));
      if (!user) throw notFound("Хэрэглэгч олдсонгүй");
      const school = await School.findOne(idFilter(input.schoolId)).lean();
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
    addRating: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const existing = await Rating.findOne({
        userId: viewer._id,
        schoolId: input.schoolId,
      });
      if (existing) {
        existing.comment = input.comment;
        existing.scores = { ...input.scores };
        await existing.save();
        return existing.toObject();
      }
      const rating = await Rating.create({
        userId: viewer._id,
        schoolId: input.schoolId,
        comment: input.comment,
        scores: { ...input.scores },
      });
      return rating.toObject();
    },

    addTeacher: async (_parent, { input }, context) => {
      await connectDB();
      requireViewer(context);
      const schoolExists = await School.exists(idFilter(input.schoolId));
      if (!schoolExists) throw notFound("Сургууль олдсонгүй");
      const teacher = await Teacher.create({
        name: input.name,
        schoolId: input.schoolId,
        subject: input.subject,
      });
      return teacher.toObject();
    },

    // Нэг хэрэглэгч нэг багшид нэг л үнэлгээтэй — дахин илгээвэл хуучныг шинэчилнэ
    addTeacherRating: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const teacherExists = await Teacher.exists(idFilter(input.teacherId));
      if (!teacherExists) throw notFound("Багш олдсонгүй");
      const existing = await TeacherRating.findOne({
        userId: viewer._id,
        teacherId: input.teacherId,
      });
      if (existing) {
        existing.comment = input.comment;
        existing.scores = { ...input.scores };
        await existing.save();
        return existing.toObject();
      }
      const rating = await TeacherRating.create({
        userId: viewer._id,
        teacherId: input.teacherId,
        comment: input.comment,
        scores: { ...input.scores },
      });
      return rating.toObject();
    },

    addQuestion: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const schoolExists = await School.exists(idFilter(input.schoolId));
      if (!schoolExists) throw notFound("Сургууль олдсонгүй");
      const question = await Question.create({
        schoolId: input.schoolId,
        userId: viewer._id,
        text: input.text,
      });
      return question.toObject();
    },

    addAnswer: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const questionExists = await Question.exists(idFilter(input.questionId));
      if (!questionExists) throw notFound("Асуулт олдсонгүй");
      const answer = await Answer.create({
        questionId: input.questionId,
        userId: viewer._id,
        text: input.text,
      });
      return answer.toObject();
    },

    toggleAnswerUpvote: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const answer = await Answer.findOne(idFilter(input.answerId));
      if (!answer) throw notFound("Хариулт олдсонгүй");
      answer.upvotedBy = answer.upvotedBy ?? [];
      const index = answer.upvotedBy.indexOf(viewer._id);
      if (index === -1) {
        answer.upvotedBy.push(viewer._id);
      } else {
        answer.upvotedBy.splice(index, 1);
      }
      await answer.save();
      return answer.toObject();
    },

    acceptAnswer: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const question = await Question.findOne(idFilter(input.questionId));
      if (!question) throw notFound("Асуулт олдсонгүй");
      if (question.userId !== viewer._id) {
        throw new GraphQLError(
          "Зөвхөн асуултыг асуусан хэрэглэгч хариултыг зөв гэж тэмдэглэх боломжтой"
        );
      }
      const answerExists = await Answer.exists(idFilter(input.answerId));
      if (!answerExists) throw notFound("Хариулт олдсонгүй");
      question.acceptedAnswerId =
        question.acceptedAnswerId === input.answerId ? null : input.answerId;
      await question.save();
      return question.toObject();
    },

    // Нэг хэрэглэгч нэг сэтгэгдлийг давхар мэдэгдэхгүй — өмнөх мэдэгдлийг буцаана
    reportRating: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const ratingExists = await Rating.exists(idFilter(input.ratingId));
      if (!ratingExists) throw notFound("Сэтгэгдэл олдсонгүй");
      const existing = await Report.findOne({
        ratingId: input.ratingId,
        userId: viewer._id,
      });
      if (existing) {
        return existing.toObject();
      }
      const report = await Report.create({
        ratingId: input.ratingId,
        userId: viewer._id,
        reason: input.reason,
      });
      return report.toObject();
    },

    // Зөвхөн isAdmin=true хэрэглэгч мэдэгдлийг шийдвэрлэнэ: сэтгэгдлийг
    // устгах (deleteRating=true) эсвэл үл хэрэгсэх (зөвхөн мэдэгдлийг арилгана)
    resolveReport: async (_parent, { input }, context) => {
      await connectDB();
      requireAdmin(context);
      const report = await Report.findOne(idFilter(input.reportId));
      if (!report) throw notFound("Мэдэгдэл олдсонгүй");
      if (input.deleteRating) {
        await Rating.deleteOne(idFilter(report.ratingId));
      }
      const reportCopy = report.toObject();
      await Report.deleteOne(idFilter(input.reportId));
      return reportCopy;
    },

    addAchievement: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const schoolExists = await School.exists(idFilter(input.schoolId));
      if (!schoolExists) throw notFound("Сургууль олдсонгүй");
      if (input.year < 1900 || input.year > new Date().getFullYear() + 1) {
        throw new GraphQLError("Оны утга буруу байна");
      }
      const achievement = await Achievement.create({
        schoolId: input.schoolId,
        userId: viewer._id,
        category: input.category,
        title: input.title,
        year: input.year,
        description: input.description,
      });
      return achievement.toObject();
    },

    deleteAchievement: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const achievement = await Achievement.findOne(
        idFilter(input.achievementId)
      );
      if (!achievement) throw notFound("Амжилт олдсонгүй");
      if (achievement.userId !== viewer._id) {
        throw new GraphQLError(
          "Зөвхөн нэмсэн хэрэглэгч энэ амжилтыг устгах боломжтой"
        );
      }
      await Achievement.deleteOne(idFilter(input.achievementId));
      return achievement.toObject();
    },

    // Сургууль нэмэх нь бүх үнэлгээний тулгуур бичлэг үүсгэдэг тул зөвхөн админ.
    addSchool: async (_parent, { input }, context) => {
      await connectDB();
      requireAdmin(context);

      const schoolName = input.schoolName.trim();
      const location = input.location.trim();
      if (!schoolName) {
        throw new GraphQLError("Сургуулийн нэр хоосон байж болохгүй");
      }
      if (!location) {
        throw new GraphQLError("Байршил хоосон байж болохгүй");
      }

      // Ижил нэртэй сургууль давхардвал үнэлгээ хоёр тийш хуваагдана.
      const duplicate = await School.findOne({ schoolName });
      if (duplicate) {
        throw new GraphQLError("Ийм нэртэй сургууль аль хэдийн бүртгэлтэй байна");
      }

      const school = await School.create({
        schoolName,
        location,
        schoolType: input.schoolType ?? "HighSchool",
        isSchoolPrivate: input.isSchoolPrivate,
      });
      return school.toObject();
    },

    // Сургууль устгахад түүн рүү заасан бүх бичлэг эзэнгүй үлддэг тул
    // үнэлгээ, асуулт, багш, амжилтыг цуг цэвэрлэнэ.
    deleteSchool: async (_parent, { input }, context) => {
      await connectDB();
      requireAdmin(context);

      const school = await School.findOne(idFilter(input.schoolId));
      if (!school) throw notFound("Сургууль олдсонгүй");
      const schoolId = String(school._id);

      const ratings = await Rating.find({ schoolId }).select("_id").lean();
      const ratingIds = ratings.map((rating) => String(rating._id));
      await Report.deleteMany({ ratingId: { $in: ratingIds } });
      await Rating.deleteMany({ schoolId });

      // Багш устахад түүнд өгсөн үнэлгээ өнчирдөг тул хамт устгана.
      const teachers = await Teacher.find({ schoolId }).select("_id").lean();
      const teacherIds = teachers.map((teacher) => String(teacher._id));
      await TeacherRating.deleteMany({ teacherId: { $in: teacherIds } });
      await Teacher.deleteMany({ schoolId });

      // Асуулт устахад түүнд ирсэн хариултууд ч мөн адил.
      const questions = await Question.find({ schoolId }).select("_id").lean();
      const questionIds = questions.map((question) => String(question._id));
      await Answer.deleteMany({ questionId: { $in: questionIds } });
      await Question.deleteMany({ schoolId });

      await Achievement.deleteMany({ schoolId });

      // Хэрэглэгчийн дуртай жагсаалт болон бүртгүүлсэн сургуулиас хасна.
      await User.updateMany(
        { favoriteSchoolIds: schoolId },
        { $pull: { favoriteSchoolIds: schoolId } }
      );
      await User.updateMany(
        { "schools.schoolId": schoolId },
        { $pull: { schools: { schoolId } } }
      );

      const removed = school.toObject();
      await School.deleteOne(idFilter(schoolId));
      return removed;
    },

    // Сургуулийн үндсэн мэдээллийг зөвхөн админ засна — нэр, байршил нь
    // бүх үнэлгээний тулгуур мэдээлэл тул санамсаргүй өөрчлөгдөх ёсгүй.
    updateSchoolInfo: async (_parent, { input }, context) => {
      await connectDB();
      requireAdmin(context);
      const schoolName = input.schoolName.trim();
      const location = input.location.trim();
      if (!schoolName) {
        throw new GraphQLError("Сургуулийн нэр хоосон байж болохгүй");
      }
      if (!location) {
        throw new GraphQLError("Байршил хоосон байж болохгүй");
      }
      const school = await School.findOne(idFilter(input.schoolId));
      if (!school) throw notFound("Сургууль олдсонгүй");
      school.schoolName = schoolName;
      school.location = location;
      school.schoolType = input.schoolType;
      school.isSchoolPrivate = input.isSchoolPrivate;
      await school.save();
      return school.toObject();
    },

    updateSchoolFees: async (_parent, { input }, context) => {
      await connectDB();
      requireAdmin(context);
      if (input.semesterFee < 0 || input.dormFee < 0) {
        throw new GraphQLError("Төлбөрийн дүн сөрөг байж болохгүй");
      }
      const school = await School.findOne(idFilter(input.schoolId));
      if (!school) throw notFound("Сургууль олдсонгүй");
      school.semesterFee = input.semesterFee;
      school.dormFee = input.dormFee;
      school.hasScholarship = input.hasScholarship;
      school.scholarshipInfo = input.scholarshipInfo;
      await school.save();
      return school.toObject();
    },

    updateAdmissionInfo: async (_parent, { input }, context) => {
      await connectDB();
      requireAdmin(context);
      const school = await School.findOne(idFilter(input.schoolId));
      if (!school) throw notFound("Сургууль олдсонгүй");
      school.admissionThreshold = input.admissionThreshold;
      school.admissionExam = input.admissionExam;
      school.admissionMaterials = input.admissionMaterials;
      school.admissionDeadline = input.admissionDeadline;
      await school.save();
      return school.toObject();
    },

    addSchoolPhoto: async (_parent, { input }, context) => {
      await connectDB();
      requireAdmin(context);
      if (!input.photoBase64 || input.photoBase64.length === 0) {
        throw new GraphQLError("Зураг хоосон байна");
      }
      if (input.photoBase64.length > MAX_PHOTO_BASE64_LENGTH) {
        throw new GraphQLError("Зургийн хэмжээ хэт том байна");
      }
      const school = await School.findOne(idFilter(input.schoolId));
      if (!school) throw notFound("Сургууль олдсонгүй");
      school.photos = school.photos ?? [];
      school.photos.push(input.photoBase64);
      if (school.photos.length > MAX_PHOTOS_PER_SCHOOL) {
        school.photos = school.photos.slice(-MAX_PHOTOS_PER_SCHOOL);
      }
      await school.save();
      return school.toObject();
    },

    removeSchoolPhoto: async (_parent, { input }, context) => {
      await connectDB();
      requireAdmin(context);
      const school = await School.findOne(idFilter(input.schoolId));
      if (!school) throw notFound("Сургууль олдсонгүй");
      school.photos = school.photos ?? [];
      if (input.photoIndex < 0 || input.photoIndex >= school.photos.length) {
        throw new GraphQLError("Зураг олдсонгүй");
      }
      school.photos.splice(input.photoIndex, 1);
      await school.save();
      return school.toObject();
    },

    toggleFavoriteSchool: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const user = await User.findOne(idFilter(viewer._id));
      if (!user) throw notFound("Хэрэглэгч олдсонгүй");
      const schoolExists = await School.exists(idFilter(input.schoolId));
      if (!schoolExists) throw notFound("Сургууль олдсонгүй");
      user.favoriteSchoolIds = user.favoriteSchoolIds ?? [];
      const index = user.favoriteSchoolIds.indexOf(input.schoolId);
      if (index === -1) {
        user.favoriteSchoolIds.push(input.schoolId);
      } else {
        user.favoriteSchoolIds.splice(index, 1);
      }
      await user.save();
      return user.toObject();
    },

    // Хэрэглэгч зөвхөн ӨӨРИЙН үнэлгээг устгана; админ бүгдийг устгаж чадна.
    deleteRating: async (_parent, { _id }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const rating = await Rating.findOne(idFilter(_id)).lean();
      if (!rating) throw notFound("Үнэлгээ олдсонгүй");
      if (String(rating.userId) !== String(viewer._id) && !viewer.isAdmin) {
        throw new GraphQLError("Зөвхөн өөрийн үнэлгээг устгах боломжтой", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      await Rating.deleteOne(idFilter(_id));
      return rating;
    },

    // Хэрэглэгчийг устгахад түүний үлдээсэн бүх контентыг цуг арилгана —
    // эс тэгвэл өнчин баримт үлдэж, сургуулийн дундаж оноо буруу тооцогдоно.
    deleteUser: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireAdmin(context);
      const user = await User.findOne(idFilter(input.userId));
      if (!user) throw notFound("Хэрэглэгч олдсонгүй");

      const userId = String(user._id);
      if (userId === String(viewer._id)) {
        throw new GraphQLError("Өөрийн бүртгэлийг устгах боломжгүй");
      }

      const ratings = await Rating.find({ userId }).select("_id").lean();
      const ratingIds = ratings.map((rating) => String(rating._id));
      // Түүний илгээсэн болон түүний үнэлгээ рүү чиглэсэн мэдэгдэл хоёулаа устана.
      await Report.deleteMany({
        $or: [{ userId }, { ratingId: { $in: ratingIds } }],
      });
      await Rating.deleteMany({ userId });
      await TeacherRating.deleteMany({ userId });

      // Асуулт устахад түүнд ирсэн бусдын хариулт өнчирдөг тул хамт устгана.
      const questions = await Question.find({ userId }).select("_id").lean();
      const questionIds = questions.map((question) => String(question._id));
      const answers = await Answer.find({
        $or: [{ userId }, { questionId: { $in: questionIds } }],
      })
        .select("_id")
        .lean();
      const answerIds = answers.map((answer) => String(answer._id));

      await Answer.deleteMany({ _id: { $in: answers.map((a) => a._id) } });
      await Question.deleteMany({ userId });
      await Achievement.deleteMany({ userId });
      // Үлдсэн асуултууд устсан хариулт руу заасаар байвал цэвэрлэнэ.
      await Question.updateMany(
        { acceptedAnswerId: { $in: answerIds } },
        { $set: { acceptedAnswerId: null } }
      );
      // Бусдын хариулт дээр өгсөн түүний саналыг хасна.
      await Answer.updateMany(
        { upvotedBy: userId },
        { $pull: { upvotedBy: userId } }
      );

      const removed = user.toObject();
      await User.deleteOne(idFilter(userId));
      return removed;
    },

    editRating: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const rating = await Rating.findOne({
        userId: viewer._id,
        schoolId: input.schoolId,
      });
      if (!rating) throw notFound("Үнэлгээ олдсонгүй");
      rating.comment = input.comment;
      rating.scores = { ...input.scores };
      await rating.save();
      return rating.toObject();
    },

    editUser: async (_parent, { input }, context) => {
      await connectDB();
      const viewer = requireViewer(context);
      const user = await User.findOne(idFilter(viewer._id));
      if (!user) throw notFound("Хэрэглэгч олдсонгүй");
      const excludedIds = mongoose.isValidObjectId(viewer._id)
        ? [viewer._id, new mongoose.Types.ObjectId(viewer._id)]
        : [viewer._id];
      const phoneTaken = await User.findOne({
        _id: { $nin: excludedIds },
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
    favoriteSchoolIds: (parent) => parent.favoriteSchoolIds ?? [],
    isAdmin: (parent) => parent.isAdmin ?? false,
  },

  rating: {
    // Хуучин бичлэгүүдэд createdAt байхгүй тул "" буцаана — фронтенд үүнийг
    // тренд тооцооноос хасаж, зөвхөн шинэ огноотой үнэлгээг ашиглана.
    createdAt: (parent) => parent.createdAt ?? "",
  },

  scores: {
    // "Дотуур байр" ангилал хожим нэмэгдсэн тул хуучин үнэлгээнүүдэд
    // dorm талбар байхгүй — 0 буцааж, тренд/дундаж тооцоог эвдэхгүй.
    dorm: (parent) => parent.dorm ?? 0,
  },

  School: {
    photos: (parent) => parent.photos ?? [],
    semesterFee: (parent) => parent.semesterFee ?? 0,
    dormFee: (parent) => parent.dormFee ?? 0,
    hasScholarship: (parent) => parent.hasScholarship ?? false,
    scholarshipInfo: (parent) => parent.scholarshipInfo ?? "",
    admissionThreshold: (parent) => parent.admissionThreshold ?? "",
    admissionExam: (parent) => parent.admissionExam ?? "",
    admissionMaterials: (parent) => parent.admissionMaterials ?? "",
    admissionDeadline: (parent) => parent.admissionDeadline ?? "",
  },

  schoolAnswer: {
    upvotedBy: (parent) => parent.upvotedBy ?? [],
  },
};
