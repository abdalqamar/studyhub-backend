import Course from "../models/courseModal.js";
import { TokenPayload } from "../types/auth.types.js";

type OwnershipCheckResult =
  | { ok: true; course: InstanceType<typeof Course> }
  | { ok: false; status: number; message: string };

export const verifyCourseOwnership = async (
  courseId: string,
  reqUser: TokenPayload,
): Promise<OwnershipCheckResult> => {
  const course = await Course.findById(courseId);

  if (!course) {
    return { ok: false, status: 404, message: "Course not found" };
  }

  const isOwner = course.instructor.toString() === reqUser.id;
  const isAdmin = reqUser.role === "admin";

  if (!isOwner && !isAdmin) {
    return {
      ok: false,
      status: 403,
      message: "You are not authorized to modify this course",
    };
  }

  return { ok: true, course };
};
