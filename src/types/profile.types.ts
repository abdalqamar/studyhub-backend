export interface IProfile {
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  contactNumber?: number;
  about?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  contactNumber?: number;
  about?: string;
  gender?: "male" | "female" | "other";
}
