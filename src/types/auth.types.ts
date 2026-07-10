export type TokenPayload = {
  id: string;
  email: string;
  role: "student" | "instructor" | "admin";
};
