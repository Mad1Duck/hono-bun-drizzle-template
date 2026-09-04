export const fileUtils = (file: File): { originalName: string; ext: string; } => {
  const lastDot = file.name.lastIndexOf('.');
  if (lastDot <= 0) {
    return { originalName: file.name, ext: '' };
  }
  const originalName = file.name.slice(0, lastDot);
  const ext = file.name.slice(lastDot + 1);
  return { originalName, ext };
};
