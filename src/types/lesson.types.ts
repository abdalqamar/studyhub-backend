export interface ILesson {
  title: string;
  description: string;
  duration?: number;
  videoUrl?: string;
  publicId?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface CreateLessonDTO {
  title: string;
  description: string;
}

export interface UpdateLessonDTO {
  title?: string;
  description?: string;
}
