const fileSizeFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

export const isCreateListingImageFile = (file: Pick<File, "type">) => {
  return file.type.startsWith("image/");
};

export const formatCreateListingFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024 * 1024) {
    return `${fileSizeFormatter.format(sizeInBytes / 1024)} KB`;
  }

  return `${fileSizeFormatter.format(sizeInBytes / (1024 * 1024))} MB`;
};

export const describeCreateListingImage = (
  file: Pick<File, "size" | "type">,
) => {
  const subtype = file.type.split("/")[1];
  const readableType = subtype ? subtype.toUpperCase() : "IMAGE";

  return `${readableType} • ${formatCreateListingFileSize(file.size)}`;
};
