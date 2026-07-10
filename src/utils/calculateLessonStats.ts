type Lesson = {
  duration?: number;
};

export const calculateLessonStats = (
  lessons: Lesson[] = [],
): { totalMinutes: number; hours: number; minutes: number } => {
  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { totalMinutes, hours, minutes };
};
