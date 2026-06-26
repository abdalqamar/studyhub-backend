// Helper to calculate lesson duration and total minutes
export const calculateLessonStats = (lessons = []) => {
  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { totalMinutes, hours, minutes };
};
